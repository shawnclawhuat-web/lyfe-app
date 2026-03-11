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
import { programmeSchema } from '@/lib/schemas';
import type { RoadmapProgramme } from '@/lib/types';
import { createProgramme, updateProgramme } from './actions';
import type { Resolver } from 'react-hook-form';

type ProgrammeFormValues = {
    slug: string;
    title: string;
    description: string | null;
    display_order: number;
    icon_type: 'seedling' | 'sprout';
    is_active: boolean;
};

interface ProgrammeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    programme: RoadmapProgramme | null;
}

export function ProgrammeDialog({ open, onOpenChange, programme }: ProgrammeDialogProps) {
    const isEdit = programme !== null;

    const form = useForm<ProgrammeFormValues>({
        resolver: zodResolver(programmeSchema) as unknown as Resolver<ProgrammeFormValues>,
        defaultValues: {
            slug: '',
            title: '',
            description: null,
            display_order: 0,
            icon_type: 'seedling',
            is_active: true,
        },
    });

    useEffect(() => {
        if (programme) {
            form.reset({
                slug: programme.slug,
                title: programme.title,
                description: programme.description,
                display_order: programme.display_order,
                icon_type: programme.icon_type,
                is_active: programme.is_active,
            });
        } else {
            form.reset({
                slug: '',
                title: '',
                description: null,
                display_order: 0,
                icon_type: 'seedling',
                is_active: true,
            });
        }
    }, [programme, form]);

    async function onSubmit(data: ProgrammeFormValues) {
        const result = isEdit ? await updateProgramme(programme.id, data) : await createProgramme(data);

        if (result.success) {
            toast.success(isEdit ? 'Programme updated.' : 'Programme created.');
            onOpenChange(false);
        } else {
            toast.error(result.error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Programme' : 'Add Programme'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl>
                                            <Input placeholder="seed-lyfe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                        </div>

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="SeedLYFE" {...field} />
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
                                            rows={3}
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
                            name="icon_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Icon Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="seedling">Seedling</SelectItem>
                                            <SelectItem value="sprout">Sprout</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
