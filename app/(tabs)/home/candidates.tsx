import CandidateListScreen from '@/components/CandidateListScreen';

export default function HomeCandidatesScreen() {
    return (
        <CandidateListScreen
            candidateRoute={(id) => `/(tabs)/home/candidate/${id}`}
            addRoute="/(tabs)/home/add-candidate"
            isManagerView
        />
    );
}
