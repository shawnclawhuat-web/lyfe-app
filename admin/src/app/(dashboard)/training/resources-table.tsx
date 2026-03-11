'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import type { RoadmapResource, RoadmapModule, RoadmapProgramme } from '@/lib/types';
import { RESOURCE_TYPE_LABELS } from '@/lib/types';
import { ResourceDialog } from './resource-dialog';
import { deleteResource } from './actions';

interface ResourcesTableProps {
    resources: RoadmapResource[];
    modules: RoadmapModule[];
    programmes: RoadmapProgramme[];
}

export function ResourcesTable({ resources, modules, programmes }: ResourcesTableProps) {
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<RoadmapResource | null>(null);

    // Group modules by programme for the dropdown
    const modulesByProgramme = useMemo(() => {
        const grouped = new Map<string, { programme: RoadmapProgramme; modules: RoadmapModule[] }>();
        programmes.forEach((p) => {
            grouped.set(p.id, { programme: p, modules: [] });
        });
        modules
            .filter((m) => !m.archived_at)
            .forEach((m) => {
                grouped.get(m.programme_id)?.modules.push(m);
            });
        return Array.from(grouped.values()).filter((g) => g.modules.length > 0);
    }, [modules, programmes]);

    const filteredResources = selectedModuleId ? resources.filter((r) => r.module_id === selectedModuleId) : [];

    function handleEdit(resource: RoadmapResource) {
        setEditingResource(resource);
        setDialogOpen(true);
    }

    async function handleDelete(resource: RoadmapResource) {
        const confirmed = window.confirm(`Delete resource "${resource.title}"? This cannot be undone.`);
        if (!confirmed) return;

        const result = await deleteResource(resource.id);
        if (result.success) {
            toast.success('Resource deleted.');
        } else {
            toast.error(result.error);
        }
    }

    function handleAdd() {
        setEditingResource(null);
        setDialogOpen(true);
    }

    const columns: ColumnDef<RoadmapResource>[] = [
        {
            accessorKey: 'title',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        },
        {
            accessorKey: 'resource_type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.getValue<string>('resource_type');
                return (
                    <Badge variant="outline">
                        {RESOURCE_TYPE_LABELS[type as keyof typeof RESOURCE_TYPE_LABELS] ?? type}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'content_url',
            header: 'URL',
            cell: ({ row }) => {
                const url = row.getValue<string | null>('content_url');
                if (!url) return '—';
                const truncated = url.length > 40 ? `${url.slice(0, 40)}...` : url;
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                        title={url}
                    >
                        {truncated}
                    </a>
                );
            },
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
            id: 'actions',
            cell: ({ row }) => {
                const resource = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(resource)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDelete(resource)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                        <SelectTrigger className="w-[360px]">
                            <SelectValue placeholder="Select a module to view resources" />
                        </SelectTrigger>
                        <SelectContent>
                            {modulesByProgramme.map(({ programme, modules: progModules }) => (
                                <SelectGroup key={programme.id}>
                                    <SelectLabel>{programme.title}</SelectLabel>
                                    {progModules.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.title}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredResources}
                    searchColumn="title"
                    searchPlaceholder="Search resources..."
                    actions={
                        <Button size="sm" onClick={handleAdd} disabled={!selectedModuleId}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Resource
                        </Button>
                    }
                />
            </div>

            <ResourceDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingResource(null);
                }}
                resource={editingResource}
                moduleId={selectedModuleId}
            />
        </>
    );
}
