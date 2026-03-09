import { pickAndUploadAvatar, takeAndUploadAvatar, removeAvatar } from '@/lib/storage';

jest.mock('@/lib/supabase');

const mockImagePicker = {
    requestMediaLibraryPermissionsAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
    launchCameraAsync: jest.fn(),
};

jest.mock('expo-image-picker', () => mockImagePicker);

const { supabase } = require('@/lib/supabase');

describe('storage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default storage mock
        supabase.storage.from.mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
            getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/avatar.jpg' } }),
            remove: jest.fn().mockResolvedValue({ error: null }),
        });
        // Mock fetch for _uploadUri
        global.fetch = jest.fn().mockResolvedValue({
            blob: jest.fn().mockResolvedValue(new Blob(['mock'])),
        }) as any;
        global.Response = class MockResponse {
            private body: any;
            constructor(body: any) {
                this.body = body;
            }
            arrayBuffer() {
                return Promise.resolve(new ArrayBuffer(8));
            }
        } as any;
    });

    describe('pickAndUploadAvatar', () => {
        it('returns error when permission is denied', async () => {
            mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'denied' });

            const result = await pickAndUploadAvatar('user-1');
            expect(result.error).toBe('Permission to access photos is required.');
            expect(result.url).toBeNull();
        });

        it('returns null when user cancels picker', async () => {
            mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
            mockImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });

            const result = await pickAndUploadAvatar('user-1');
            expect(result.url).toBeNull();
            expect(result.error).toBeNull();
        });

        it('uploads and returns URL on success', async () => {
            mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
            mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
                canceled: false,
                assets: [{ uri: 'file:///photo.jpg' }],
            });

            const result = await pickAndUploadAvatar('user-1');
            expect(result.url).toContain('https://example.com/avatar.jpg');
            expect(result.error).toBeNull();
        });

        it('returns error when upload fails', async () => {
            mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
            mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
                canceled: false,
                assets: [{ uri: 'file:///photo.jpg' }],
            });
            supabase.storage.from.mockReturnValue({
                upload: jest.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
                getPublicUrl: jest.fn(),
            });

            const result = await pickAndUploadAvatar('user-1');
            expect(result.url).toBeNull();
            expect(result.error).toBe('Upload failed');
        });
    });

    describe('takeAndUploadAvatar', () => {
        it('returns error when camera permission is denied', async () => {
            mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' });

            const result = await takeAndUploadAvatar('user-1');
            expect(result.error).toBe('Camera permission is required.');
            expect(result.url).toBeNull();
        });

        it('returns null when user cancels camera', async () => {
            mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
            mockImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true });

            const result = await takeAndUploadAvatar('user-1');
            expect(result.url).toBeNull();
            expect(result.error).toBeNull();
        });

        it('uploads and returns URL on success', async () => {
            mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
            mockImagePicker.launchCameraAsync.mockResolvedValue({
                canceled: false,
                assets: [{ uri: 'file:///camera.jpg' }],
            });

            const result = await takeAndUploadAvatar('user-1');
            expect(result.url).toContain('https://example.com/avatar.jpg');
            expect(result.error).toBeNull();
        });
    });

    describe('removeAvatar', () => {
        it('removes avatar from storage and clears user avatar_url', async () => {
            const mockRemove = jest.fn().mockResolvedValue({ error: null });
            supabase.storage.from.mockReturnValue({
                remove: mockRemove,
            });

            const result = await removeAvatar('user-1');
            expect(result.error).toBeNull();
            expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
            expect(mockRemove).toHaveBeenCalledWith(['user-1/avatar.jpg']);
        });

        it('returns error when storage remove fails', async () => {
            supabase.storage.from.mockReturnValue({
                remove: jest.fn().mockResolvedValue({ error: { message: 'Remove failed' } }),
            });

            const result = await removeAvatar('user-1');
            expect(result.error).toBe('Remove failed');
        });
    });
});
