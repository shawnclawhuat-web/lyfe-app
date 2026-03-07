import CandidateListScreen from '@/components/CandidateListScreen';
import { useViewMode } from '@/contexts/ViewModeContext';

// Re-export for backward compatibility (consumed from @/lib/mockData internally,
// but external callers that import MOCK_CANDIDATES from this module still work).
export { MOCK_CANDIDATES } from '@/lib/mockData';

export default function CandidatesScreen() {
    const { viewMode, canToggle } = useViewMode();
    const isManagerView = canToggle && viewMode === 'manager';

    return (
        <CandidateListScreen
            candidateRoute={(id) => `/candidates/${id}`}
            addRoute="/team/add-candidate"
            isManagerView={isManagerView}
        />
    );
}
