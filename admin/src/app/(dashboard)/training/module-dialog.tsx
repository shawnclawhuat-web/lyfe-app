'use client';

import { useEffect, useState } from 'react';
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
import { moduleSchema } from '@/lib/schemas';
import type { RoadmapModule, RoadmapProgramme, RoadmapPrerequisite, ExamPaper } from '@/lib/types';
import { createModule, updateModule, setModulePrerequisites } from './actions';
import type { Resolver } from 'react-hook-form';

type ModuleFormValues = {
    programme_id: string;
    title: string;
    description: string | null;
    learning_objectives: string | null;
    module_type: 'training' | 'exam' | 'resource';
    display_order: number;
    is_active: boolean;
    is_required: boolean;
    estimated_minutes: number | null;
    exam_paper_id: string | null;
    icon_name: string | null;
    icon_color: string | null;
};

interface ModuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    module: RoadmapModule | null;
    programmes: RoadmapProgramme[];
    allModules: RoadmapModule[];
    prerequisites: RoadmapPrerequisite[];
    examPapers: ExamPaper[];
}

export function ModuleDialog({
    open,
    onOpenChange,
    module,
    programmes,
    allModules,
    prerequisites,
    examPapers,
}: ModuleDialogProps) {
    const isEdit = module !== null;
    const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);

    const form = useForm<ModuleFormValues>({
        resolver: zodResolver(moduleSchema) as unknown as Resolver<ModuleFormValues>,
        defaultValues: {
            programme_id: '',
            title: '',
            description: null,
            learning_objectives: null,
            module_type: 'training',
            display_order: 0,
            is_active: true,
            is_required: true,
            estimated_minutes: null,
            exam_paper_id: null,
            icon_name: null,
            icon_color: null,
        },
    });

    const watchedProgrammeId = form.watch('programme_id');
    const watchedModuleType = form.watch('module_type');

    // Available prerequisite modules: same programme, active, not archived, not self
    const availablePrereqs = allModules.filter(
        (m) => m.programme_id === watchedProgrammeId && !m.archived_at && m.is_active && m.id !== module?.id,
    );

    useEffect(() => {
        if (module) {
            form.reset({
                programme_id: module.programme_id,
                title: module.title,
                description: module.description,
                learning_objectives: module.learning_objectives,
                module_type: module.module_type,
                display_order: module.display_order,
                is_active: module.is_active,
                is_required: module.is_required,
                estimated_minutes: module.estimated_minutes,
                exam_paper_id: module.exam_paper_id,
                icon_name: module.icon_name,
                icon_color: module.icon_color,
            });
            // Load existing prerequisites for this module
            const existing = prerequisites.filter((p) => p.module_id === module.id).map((p) => p.required_module_id);
            setSelectedPrereqs(existing);
        } else {
            form.reset({
                programme_id: '',
                title: '',
                description: null,
                learning_objectives: null,
                module_type: 'training',
                display_order: 0,
                is_active: true,
                is_required: true,
                estimated_minutes: null,
                exam_paper_id: null,
                icon_name: null,
                icon_color: null,
            });
            setSelectedPrereqs([]);
        }
    }, [module, form, prerequisites]);

    function togglePrereq(moduleId: string) {
        setSelectedPrereqs((prev) =>
            prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
        );
    }

    async function onSubmit(data: ModuleFormValues) {
        // Circular dependency check: make sure none of the selected prereqs
        // themselves require this module
        if (isEdit) {
            const reversePrereqs = prerequisites.filter((p) => p.module_id !== module.id);
            for (const prereqId of selectedPrereqs) {
                const reverseExists = reversePrereqs.some(
                    (p) => p.module_id === prereqId && p.required_module_id === module.id,
                );
                if (reverseExists) {
                    const prereqModule = allModules.find((m) => m.id === prereqId);
                    toast.error(`Circular dependency: "${prereqModule?.title}" already requires this module.`);
                    return;
                }
            }
        }

        const result = isEdit ? await updateModule(module.id, data) : await createModule(data);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        // Save prerequisites if editing (for new modules we'd need the ID from insert)
        if (isEdit) {
            const prereqResult = await setModulePrerequisites(module.id, selectedPrereqs);
            if (!prereqResult.success) {
                toast.error(`Module saved, but prerequisites failed: ${prereqResult.error}`);
                onOpenChange(false);
                return;
            }
        }

        toast.success(isEdit ? 'Module updated.' : 'Module created.');
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Module' : 'Add Module'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="programme_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programme</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select programme" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {programmes.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.title}
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
                                name="module_type"
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
                                                <SelectItem value="training">Training</SelectItem>
                                                <SelectItem value="exam">Exam</SelectItem>
                                                <SelectItem value="resource">Resource</SelectItem>
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
                                        <Input placeholder="Module title" {...field} />
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

                        <FormField
                            control={form.control}
                            name="learning_objectives"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Learning Objectives</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Optional learning objectives"
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

                        <div className="grid grid-cols-3 gap-4">
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
                                name="estimated_minutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (min)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="—"
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
                            {watchedModuleType === 'exam' && (
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
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                            <FormField
                                control={form.control}
                                name="icon_color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Icon Color</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. #4A90D9"
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

                        {/* Prerequisites multi-select */}
                        {isEdit && availablePrereqs.length > 0 && (
                            <div className="space-y-2">
                                <FormLabel>Prerequisites</FormLabel>
                                <div className="rounded-md border p-3 space-y-2 max-h-40 overflow-y-auto">
                                    {availablePrereqs.map((m) => (
                                        <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <Checkbox
                                                checked={selectedPrereqs.includes(m.id)}
                                                onCheckedChange={() => togglePrereq(m.id)}
                                            />
                                            {m.title}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Selected prerequisites must be completed before this module is unlocked.
                                </p>
                            </div>
                        )}

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
