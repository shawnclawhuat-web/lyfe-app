'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Archive, RotateCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import type { RoadmapModule, RoadmapProgramme, RoadmapPrerequisite, ExamPaper } from '@/lib/types';
import { MODULE_TYPE_LABELS } from '@/lib/types';
import { ModuleDialog } from './module-dialog';
import { archiveModule, restoreModule, toggleModuleActive } from './actions';

const MODULE_TYPE_COLORS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    training: 'default',
    exam: 'destructive',
    resource: 'secondary',
};

interface ModulesTableProps {
    modules: RoadmapModule[];
    programmes: RoadmapProgramme[];
    prerequisites: RoadmapPrerequisite[];
    examPapers: ExamPaper[];
    adminUserId: string;
}

export function ModulesTable({ modules, programmes, prerequisites, examPapers, adminUserId }: ModulesTableProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<RoadmapModule | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [filterProgrammeId, setFilterProgrammeId] = useState<string>('all');

    const programmeMap = useMemo(() => {
        const map = new Map<string, string>();
        programmes.forEach((p) => map.set(p.id, p.title));
        return map;
    }, [programmes]);

    const filteredModules = useMemo(() => {
        let result = modules;
        if (!showArchived) {
            result = result.filter((m) => !m.archived_at);
        }
        if (filterProgrammeId !== 'all') {
            result = result.filter((m) => m.programme_id === filterProgrammeId);
        }
        return result;
    }, [modules, showArchived, filterProgrammeId]);

    function handleEdit(mod: RoadmapModule) {
        setEditingModule(mod);
        setDialogOpen(true);
    }

    async function handleArchive(mod: RoadmapModule) {
        const confirmed = window.confirm(
            `Archive "${mod.title}"?\n\nArchiving will:\n` +
                `\u2022 Remove it from all candidate roadmaps immediately\n` +
                `\u2022 Exclude it from completion percentages\n` +
                `\u2022 Preserve all historical progress data permanently\n` +
                `\u2022 Skip it as a prerequisite for downstream modules\n\n` +
                `This can be reversed by restoring the module later.`,
        );
        if (!confirmed) return;

        const result = await archiveModule(mod.id, adminUserId);
        if (result.success) {
            toast.success('Module archived.');
        } else {
            toast.error(result.error);
        }
    }

    async function handleRestore(mod: RoadmapModule) {
        const confirmed = window.confirm(`Restore "${mod.title}"?`);
        if (!confirmed) return;

        const result = await restoreModule(mod.id);
        if (result.success) {
            toast.success('Module restored.');
        } else {
            toast.error(result.error);
        }
    }

    async function handleToggleActive(mod: RoadmapModule) {
        if (mod.is_active) {
            const confirmed = window.confirm(
                `Disable "${mod.title}"? Disabling will hide this module from all candidate roadmaps.`,
            );
            if (!confirmed) return;
        }

        const result = await toggleModuleActive(mod.id, !mod.is_active);
        if (result.success) {
            toast.success(mod.is_active ? 'Module disabled.' : 'Module enabled.');
        } else {
            toast.error(result.error);
        }
    }

    function handleAdd() {
        setEditingModule(null);
        setDialogOpen(true);
    }

    const columns: ColumnDef<RoadmapModule>[] = [
        {
            accessorKey: 'title',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        },
        {
            accessorKey: 'programme_id',
            header: 'Programme',
            cell: ({ row }) => (
                <Badge variant="outline">{programmeMap.get(row.getValue('programme_id')) ?? 'Unknown'}</Badge>
            ),
        },
        {
            accessorKey: 'module_type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.getValue<string>('module_type');
                return (
                    <Badge variant={MODULE_TYPE_COLORS[type] ?? 'outline'}>
                        {MODULE_TYPE_LABELS[type as keyof typeof MODULE_TYPE_LABELS] ?? type}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'display_order',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
        },
        {
            accessorKey: 'is_required',
            header: 'Required',
            cell: ({ row }) => (row.getValue<boolean>('is_required') ? 'Yes' : '—'),
        },
        {
            accessorKey: 'estimated_minutes',
            header: 'Duration',
            cell: ({ row }) => {
                const min = row.getValue<number | null>('estimated_minutes');
                return min ? `${min} min` : '—';
            },
        },
        {
            id: 'exam_paper',
            header: 'Exam Paper',
            cell: ({ row }) => {
                const mod = row.original;
                return mod.exam_papers ? `${mod.exam_papers.code}` : '—';
            },
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const mod = row.original;
                if (mod.archived_at) {
                    return <Badge variant="destructive">Archived</Badge>;
                }
                return (
                    <Badge
                        variant={mod.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(mod)}
                    >
                        {mod.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const mod = row.original;
                const isArchived = mod.archived_at !== null;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(mod)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            {isArchived ? (
                                <DropdownMenuItem onClick={() => handleRestore(mod)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => handleArchive(mod)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Select value={filterProgrammeId} onValueChange={setFilterProgrammeId}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="All programmes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Programmes</SelectItem>
                            {programmes.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                            checked={showArchived}
                            onCheckedChange={(checked) => setShowArchived(checked === true)}
                        />
                        Show archived
                    </label>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredModules}
                    searchColumn="title"
                    searchPlaceholder="Search modules..."
                    actions={
                        <Button size="sm" onClick={handleAdd}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Module
                        </Button>
                    }
                />
            </div>

            <ModuleDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingModule(null);
                }}
                module={editingModule}
                programmes={programmes}
                allModules={modules}
                prerequisites={prerequisites}
                examPapers={examPapers}
            />
        </>
    );
}
