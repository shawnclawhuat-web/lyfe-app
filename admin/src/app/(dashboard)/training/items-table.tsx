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
import type { RoadmapModuleItem, RoadmapModule, ExamPaper } from '@/lib/types';
import { ITEM_TYPE_LABELS } from '@/lib/types';
import { ItemDialog } from './item-dialog';
import { archiveModuleItem, restoreModuleItem } from './actions';

const ITEM_TYPE_COLORS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    material: 'default',
    pre_quiz: 'secondary',
    quiz: 'secondary',
    exam: 'destructive',
    attendance: 'outline',
};

interface ItemsTableProps {
    items: RoadmapModuleItem[];
    modules: RoadmapModule[];
    examPapers: ExamPaper[];
    adminUserId: string;
}

export function ItemsTable({ items, modules, examPapers, adminUserId }: ItemsTableProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RoadmapModuleItem | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [filterModuleId, setFilterModuleId] = useState<string>('all');

    const moduleMap = useMemo(() => {
        const map = new Map<string, string>();
        modules.forEach((m) => map.set(m.id, m.title));
        return map;
    }, [modules]);

    const filteredItems = useMemo(() => {
        let result = items;
        if (!showArchived) {
            result = result.filter((i) => !i.archived_at);
        }
        if (filterModuleId !== 'all') {
            result = result.filter((i) => i.module_id === filterModuleId);
        }
        return result;
    }, [items, showArchived, filterModuleId]);

    function handleEdit(item: RoadmapModuleItem) {
        setEditingItem(item);
        setDialogOpen(true);
    }

    async function handleArchive(item: RoadmapModuleItem) {
        const confirmed = window.confirm(`Archive "${item.title}"? This can be reversed by restoring the item later.`);
        if (!confirmed) return;

        const result = await archiveModuleItem(item.id, adminUserId);
        if (result.success) {
            toast.success('Item archived.');
        } else {
            toast.error(result.error);
        }
    }

    async function handleRestore(item: RoadmapModuleItem) {
        const confirmed = window.confirm(`Restore "${item.title}"?`);
        if (!confirmed) return;

        const result = await restoreModuleItem(item.id);
        if (result.success) {
            toast.success('Item restored.');
        } else {
            toast.error(result.error);
        }
    }

    function handleAdd() {
        setEditingItem(null);
        setDialogOpen(true);
    }

    const columns: ColumnDef<RoadmapModuleItem>[] = [
        {
            accessorKey: 'title',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        },
        {
            accessorKey: 'item_type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.getValue<string>('item_type');
                return (
                    <Badge variant={ITEM_TYPE_COLORS[type] ?? 'outline'}>
                        {ITEM_TYPE_LABELS[type as keyof typeof ITEM_TYPE_LABELS] ?? type}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'module_id',
            header: 'Module',
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <Badge variant="outline">
                        {item.roadmap_modules?.title ?? moduleMap.get(row.getValue('module_id')) ?? 'Unknown'}
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
            cell: ({ row }) => (row.getValue<boolean>('is_required') ? 'Yes' : '\u2014'),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const item = row.original;
                if (item.archived_at) {
                    return <Badge variant="destructive">Archived</Badge>;
                }
                return (
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const item = row.original;
                const isArchived = item.archived_at !== null;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            {isArchived ? (
                                <DropdownMenuItem onClick={() => handleRestore(item)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => handleArchive(item)}
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
                    <Select value={filterModuleId} onValueChange={setFilterModuleId}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="All modules" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Modules</SelectItem>
                            {modules
                                .filter((m) => !m.archived_at)
                                .map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.title}
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
                    data={filteredItems}
                    searchColumn="title"
                    searchPlaceholder="Search items..."
                    actions={
                        <Button size="sm" onClick={handleAdd}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    }
                />
            </div>

            <ItemDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingItem(null);
                }}
                item={editingItem}
                modules={modules}
                examPapers={examPapers}
            />
        </>
    );
}
