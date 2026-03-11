'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type {
    RoadmapProgramme,
    RoadmapModule,
    RoadmapResource,
    RoadmapPrerequisite,
    RoadmapModuleItem,
    ExamPaper,
} from '@/lib/types';
import { ProgrammesTable } from './programmes-table';
import { ModulesTable } from './modules-table';
import { ResourcesTable } from './resources-table';
import { ItemsTable } from './items-table';

interface TrainingClientProps {
    programmes: RoadmapProgramme[];
    modules: RoadmapModule[];
    resources: RoadmapResource[];
    prerequisites: RoadmapPrerequisite[];
    examPapers: ExamPaper[];
    moduleItems: RoadmapModuleItem[];
    adminUserId: string;
}

export function TrainingClient({
    programmes,
    modules,
    resources,
    prerequisites,
    examPapers,
    moduleItems,
    adminUserId,
}: TrainingClientProps) {
    return (
        <Tabs defaultValue="programmes" className="flex-1 p-6 space-y-4">
            <TabsList variant="line">
                <TabsTrigger value="programmes">Programmes</TabsTrigger>
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="programmes">
                <ProgrammesTable programmes={programmes} adminUserId={adminUserId} />
            </TabsContent>

            <TabsContent value="modules">
                <ModulesTable
                    modules={modules}
                    programmes={programmes}
                    prerequisites={prerequisites}
                    examPapers={examPapers}
                    adminUserId={adminUserId}
                />
            </TabsContent>

            <TabsContent value="items">
                <ItemsTable items={moduleItems} modules={modules} examPapers={examPapers} adminUserId={adminUserId} />
            </TabsContent>

            <TabsContent value="resources">
                <ResourcesTable resources={resources} modules={modules} programmes={programmes} />
            </TabsContent>
        </Tabs>
    );
}
