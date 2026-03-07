import CandidateListScreen from '@/components/CandidateListScreen';

export default function PaScreen() {
    return (
        <CandidateListScreen
            candidateRoute={(id) => `/(tabs)/pa/candidate/${id}`}
            addRoute="/(tabs)/pa/add-candidate"
        />
    );
}
