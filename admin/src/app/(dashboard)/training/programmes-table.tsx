'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Archive, RotateCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import type { RoadmapProgramme } from '@/lib/types';
import { ProgrammeDialog } from './programme-dialog';
import { archiveProgramme, restoreProgramme } from './actions';

interface ProgrammesTableProps {
    programmes: RoadmapProgramme[];
    adminUserId: string;
}

export function ProgrammesTable({ programmes, adminUserId }: ProgrammesTableProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProgramme, setEditingProgramme] = useState<RoadmapProgramme | null>(null);

    function handleEdit(programme: RoadmapProgramme) {
        setEditingProgramme(programme);
        setDialogOpen(true);
    }

    async function handleArchive(programme: RoadmapProgramme) {
        const confirmed = window.confirm(
            `Archive "${programme.title}"? This will deactivate the programme and hide it from candidate roadmaps.`,
        );
        if (!confirmed) return;

        const result = await archiveProgramme(programme.id, adminUserId);
        if (result.success) {
            toast.success('Programme archived.');
        } else {
            toast.error(result.error);
        }
    }

    async function handleRestore(programme: RoadmapProgramme) {
        const confirmed = window.confirm(`Restore "${programme.title}"?`);
        if (!confirmed) return;

        const result = await restoreProgramme(programme.id);
        if (result.success) {
            toast.success('Programme restored.');
        } else {
            toast.error(result.error);
        }
    }

    function handleAdd() {
        setEditingProgramme(null);
        setDialogOpen(true);
    }

    const columns: ColumnDef<RoadmapProgramme>[] = [
        {
            accessorKey: 'title',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        },
        {
            accessorKey: 'slug',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
            cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('slug')}</span>,
        },
        {
            accessorKey: 'icon_type',
            header: 'Icon Type',
            cell: ({ row }) => <Badge variant="outline">{row.getValue<string>('icon_type')}</Badge>,
        },
        {
            accessorKey: 'display_order',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => {
                const isActive = row.getValue<boolean>('is_active');
                return <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>;
            },
        },
        {
            id: 'archived',
            header: 'Archived',
            cell: ({ row }) => {
                const programme = row.original;
                return programme.archived_at ? <Badge variant="destructive">Archived</Badge> : null;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const programme = row.original;
                const isArchived = programme.archived_at !== null;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(programme)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            {isArchived ? (
                                <DropdownMenuItem onClick={() => handleRestore(programme)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => handleArchive(programme)}
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
            <DataTable
                columns={columns}
                data={programmes}
                searchColumn="title"
                searchPlaceholder="Search programmes..."
                actions={
                    <Button size="sm" onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Programme
                    </Button>
                }
            />

            <ProgrammeDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingProgramme(null);
                }}
                programme={editingProgramme}
            />
        </>
    );
}
