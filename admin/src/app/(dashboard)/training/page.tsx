import { Topbar } from '@/components/layout/topbar';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { RoadmapProgramme, RoadmapModule, RoadmapResource, RoadmapPrerequisite, ExamPaper } from '@/lib/types';
import { TrainingClient } from './training-client';

export default async function TrainingPage() {
    const supabase = await createServerSupabaseClient();

    const [
        {
            data: { user },
        },
        programmesResult,
        modulesResult,
        resourcesResult,
        prerequisitesResult,
        papersResult,
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('roadmap_programmes').select('*').order('display_order'),
        supabase.from('roadmap_modules').select('*, exam_papers(code, title)').order('display_order'),
        supabase.from('roadmap_resources').select('*').order('display_order'),
        supabase.from('roadmap_prerequisites').select('*'),
        supabase.from('exam_papers').select('id, code, title').eq('is_active', true).order('display_order'),
    ]);

    const programmes = (programmesResult.data ?? []) as RoadmapProgramme[];
    const modules = (modulesResult.data ?? []) as RoadmapModule[];
    const resources = (resourcesResult.data ?? []) as RoadmapResource[];
    const prerequisites = (prerequisitesResult.data ?? []) as RoadmapPrerequisite[];
    const examPapers = (papersResult.data ?? []) as ExamPaper[];
    const adminUserId = user?.id ?? '';

    return (
        <>
            <Topbar title="Training" />
            <TrainingClient
                programmes={programmes}
                modules={modules}
                resources={resources}
                prerequisites={prerequisites}
                examPapers={examPapers}
                adminUserId={adminUserId}
            />
        </>
    );
}
