import { renderHook, act } from '@testing-library/react-native';
import { useDocumentManager } from '@/hooks/useDocumentManager';
import type { CandidateDocument } from '@/types/recruitment';

jest.mock('@/lib/supabase');
jest.mock('@/lib/recruitment', () => ({
    fetchCandidateDocuments: jest.fn().mockResolvedValue({
        data: [
            {
                id: 'doc_1',
                candidate_id: 'c1',
                label: 'Resume',
                file_url: 'https://example.com/resume.pdf',
                file_name: 'resume.pdf',
                created_at: '2026-03-01T00:00:00.000Z',
            },
            {
                id: 'doc_2',
                candidate_id: 'c1',
                label: 'M5',
                file_url: 'https://example.com/m5.pdf',
                file_name: 'm5.pdf',
                created_at: '2026-03-02T00:00:00.000Z',
            },
        ],
        error: null,
    }),
    deleteCandidateDocument: jest.fn().mockResolvedValue({ error: null }),
    uploadCandidateDocument: jest.fn().mockResolvedValue({
        data: {
            id: 'doc_new',
            candidate_id: 'c1',
            label: 'RES5',
            file_url: 'https://example.com/res5.pdf',
            file_name: 'res5.pdf',
            created_at: '2026-03-09T00:00:00.000Z',
        },
        error: null,
    }),
}));

const { fetchCandidateDocuments, deleteCandidateDocument } = require('@/lib/recruitment');

describe('useDocumentManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with empty documents', () => {
        const { result } = renderHook(() => useDocumentManager({ candidateId: 'c1' }));
        expect(result.current.documents).toEqual([]);
        expect(result.current.showPdf).toBe(false);
        expect(result.current.showAddDoc).toBe(false);
    });

    it('loadDocuments fetches and sets documents', async () => {
        const { result } = renderHook(() => useDocumentManager({ candidateId: 'c1' }));

        await act(async () => {
            await result.current.loadDocuments();
        });

        expect(fetchCandidateDocuments).toHaveBeenCalledWith('c1');
        expect(result.current.documents).toHaveLength(2);
        expect(result.current.documents[0].id).toBe('doc_1');
    });

    it('handleViewDocument opens PDF viewer', async () => {
        const { result } = renderHook(() => useDocumentManager({ candidateId: 'c1' }));

        await act(async () => {
            await result.current.loadDocuments();
        });

        const doc = result.current.documents[0];
        act(() => result.current.handleViewDocument(doc));

        expect(result.current.showPdf).toBe(true);
        expect(result.current.pdfUrl).toBe('https://example.com/resume.pdf');
        expect(result.current.pdfTitle).toBe('Resume');
    });

    it('handleDeleteDocument removes document from list', async () => {
        const { result } = renderHook(() => useDocumentManager({ candidateId: 'c1' }));

        await act(async () => {
            await result.current.loadDocuments();
        });

        expect(result.current.documents).toHaveLength(2);

        act(() => result.current.handleDeleteDocument(result.current.documents[0]));

        expect(result.current.documents).toHaveLength(1);
        expect(result.current.documents[0].id).toBe('doc_2');
        expect(deleteCandidateDocument).toHaveBeenCalledWith('doc_1');
    });

    it('handleSelectLabel sets label to Other without picking', async () => {
        const { result } = renderHook(() => useDocumentManager({ candidateId: 'c1' }));

        await act(async () => {
            await result.current.handleSelectLabel('Other');
        });

        expect(result.current.addDocLabel).toBe('Other');
    });

    it('openAddDocSheet resets form and opens sheet', () => {
        const { result } = renderHook(() => useDocumentManager({ candidateId: 'c1' }));

        act(() => result.current.openAddDocSheet());

        expect(result.current.showAddDoc).toBe(true);
        expect(result.current.addDocLabel).toBe('');
        expect(result.current.addDocCustomLabel).toBe('');
        expect(result.current.addDocError).toBeNull();
        expect(result.current.addDocStep).toBe('label');
    });
});
