'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { moduleItemSchema } from '@/lib/schemas';
import type { RoadmapModuleItem, RoadmapModule, ExamPaper } from '@/lib/types';
import { createModuleItem, updateModuleItem } from './actions';
import type { Resolver } from 'react-hook-form';

type ItemFormValues = {
    module_id: string;
    item_type: 'material' | 'pre_quiz' | 'quiz' | 'exam' | 'attendance';
    title: string;
    description: string | null;
    display_order: number;
    is_required: boolean;
    is_active: boolean;
    icon_name: string | null;
    resource_url: string | null;
    resource_type: 'pdf' | 'video' | 'link' | 'image' | null;
    exam_paper_id: string | null;
    pass_percentage: number | null;
    time_limit_minutes: number | null;
};

interface ItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: RoadmapModuleItem | null;
    modules: RoadmapModule[];
    examPapers: ExamPaper[];
}

export function ItemDialog({ open, onOpenChange, item, modules, examPapers }: ItemDialogProps) {
    const isEdit = item !== null;

    const form = useForm<ItemFormValues>({
        resolver: zodResolver(moduleItemSchema) as unknown as Resolver<ItemFormValues>,
        defaultValues: {
            module_id: '',
            item_type: 'material',
            title: '',
            description: null,
            display_order: 0,
            is_required: true,
            is_active: true,
            icon_name: null,
            resource_url: null,
            resource_type: null,
            exam_paper_id: null,
            pass_percentage: null,
            time_limit_minutes: null,
        },
    });

    const watchedItemType = form.watch('item_type');

    useEffect(() => {
        if (item) {
            form.reset({
                module_id: item.module_id,
                item_type: item.item_type,
                title: item.title,
                description: item.description,
                display_order: item.display_order,
                is_required: item.is_required,
                is_active: item.is_active,
                icon_name: item.icon_name,
                resource_url: item.resource_url,
                resource_type: item.resource_type,
                exam_paper_id: item.exam_paper_id,
                pass_percentage: item.pass_percentage,
                time_limit_minutes: item.time_limit_minutes,
            });
        } else {
            form.reset({
                module_id: '',
                item_type: 'material',
                title: '',
                description: null,
                display_order: 0,
                is_required: true,
                is_active: true,
                icon_name: null,
                resource_url: null,
                resource_type: null,
                exam_paper_id: null,
                pass_percentage: null,
                time_limit_minutes: null,
            });
        }
    }, [item, form]);

    async function onSubmit(data: ItemFormValues) {
        // Clear conditional fields based on item_type
        if (data.item_type !== 'material') {
            data.resource_url = null;
            data.resource_type = null;
        }
        if (data.item_type !== 'exam') {
            data.exam_paper_id = null;
            data.pass_percentage = null;
            data.time_limit_minutes = null;
        }

        const result = isEdit ? await updateModuleItem(item.id, data) : await createModuleItem(data);

        if (result.success) {
            toast.success(isEdit ? 'Item updated.' : 'Item created.');
            onOpenChange(false);
        } else {
            toast.error(result.error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Item' : 'Add Item'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="module_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Module</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select module" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {modules
                                                    .filter((m) => !m.archived_at)
                                                    .map((m) => (
                                                        <SelectItem key={m.id} value={m.id}>
                                                            {m.title}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="item_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="material">Material</SelectItem>
                                                <SelectItem value="pre_quiz">Pre-Quiz</SelectItem>
                                                <SelectItem value="quiz">Quiz</SelectItem>
                                                <SelectItem value="exam">Exam</SelectItem>
                                                <SelectItem value="attendance">Attendance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Item title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Optional description"
                                            rows={2}
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value || null)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="display_order"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Order</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="icon_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Icon Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. book-outline"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Conditional: Material fields */}
                        {watchedItemType === 'material' && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="resource_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Resource URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://..."
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value || null)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="resource_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Resource Type</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
                                                value={field.value ?? '__none__'}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="None" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
                                                    <SelectItem value="pdf">PDF</SelectItem>
                                                    <SelectItem value="video">Video</SelectItem>
                                                    <SelectItem value="link">Link</SelectItem>
                                                    <SelectItem value="image">Image</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Conditional: Exam fields */}
                        {watchedItemType === 'exam' && (
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="exam_paper_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Exam Paper</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
                                                value={field.value ?? '__none__'}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="None" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
                                                    {examPapers.map((paper) => (
                                                        <SelectItem key={paper.id} value={paper.id}>
                                                            {paper.code} — {paper.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pass_percentage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pass %</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="\u2014"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value ? Number(e.target.value) : null)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="time_limit_minutes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time Limit (min)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="\u2014"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value ? Number(e.target.value) : null)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <div className="flex gap-6">
                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">Active</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="is_required"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">Required</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Saving...' : isEdit ? 'Save' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
