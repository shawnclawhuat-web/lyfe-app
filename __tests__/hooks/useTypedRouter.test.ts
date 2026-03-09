import { renderHook, act } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useTypedRouter } from '@/hooks/useTypedRouter';

describe('useTypedRouter', () => {
    const mockPush = jest.fn();
    const mockReplace = jest.fn();
    const mockBack = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
            replace: mockReplace,
            back: mockBack,
        });
    });

    it('returns push, replace, and back functions', () => {
        const { result } = renderHook(() => useTypedRouter());
        expect(result.current.push).toBeDefined();
        expect(result.current.replace).toBeDefined();
        expect(result.current.back).toBeDefined();
    });

    it('push delegates to router.push', () => {
        const { result } = renderHook(() => useTypedRouter());
        act(() => {
            result.current.push('/(tabs)/home');
        });
        expect(mockPush).toHaveBeenCalledWith('/(tabs)/home');
    });

    it('replace delegates to router.replace', () => {
        const { result } = renderHook(() => useTypedRouter());
        act(() => {
            result.current.replace('/(tabs)/exams');
        });
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/exams');
    });

    it('back delegates to router.back', () => {
        const { result } = renderHook(() => useTypedRouter());
        act(() => {
            result.current.back();
        });
        expect(mockBack).toHaveBeenCalled();
    });

    it('push works with dynamic routes', () => {
        const { result } = renderHook(() => useTypedRouter());
        act(() => {
            result.current.push('/(tabs)/events/abc123');
        });
        expect(mockPush).toHaveBeenCalledWith('/(tabs)/events/abc123');
    });

    it('replace works with dynamic routes', () => {
        const { result } = renderHook(() => useTypedRouter());
        act(() => {
            result.current.replace('/(tabs)/leads/lead-id');
        });
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/leads/lead-id');
    });
});
