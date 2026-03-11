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
import { resourceSchema } from '@/lib/schemas';
import type { RoadmapResource } from '@/lib/types';
import { createResource, updateResource } from './actions';
import type { Resolver } from 'react-hook-form';

type ResourceFormValues = {
    module_id: string;
    title: string;
    description: string | null;
    resource_type: 'link' | 'file' | 'video' | 'text';
    content_url: string | null;
    content_text: string | null;
    display_order: number;
    is_active: boolean;
};

interface ResourceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resource: RoadmapResource | null;
    moduleId: string;
}

export function ResourceDialog({ open, onOpenChange, resource, moduleId }: ResourceDialogProps) {
    const isEdit = resource !== null;

    const form = useForm<ResourceFormValues>({
        resolver: zodResolver(resourceSchema) as unknown as Resolver<ResourceFormValues>,
        defaultValues: {
            module_id: moduleId,
            title: '',
            description: null,
            resource_type: 'link',
            content_url: null,
            content_text: null,
            display_order: 0,
            is_active: true,
        },
    });

    const watchedType = form.watch('resource_type');

    useEffect(() => {
        if (resource) {
            form.reset({
                module_id: resource.module_id,
                title: resource.title,
                description: resource.description,
                resource_type: resource.resource_type,
                content_url: resource.content_url,
                content_text: resource.content_text,
                display_order: resource.display_order,
                is_active: resource.is_active,
            });
        } else {
            form.reset({
                module_id: moduleId,
                title: '',
                description: null,
                resource_type: 'link',
                content_url: null,
                content_text: null,
                display_order: 0,
                is_active: true,
            });
        }
    }, [resource, form, moduleId]);

    async function onSubmit(data: ResourceFormValues) {
        const result = isEdit ? await updateResource(resource.id, data) : await createResource(data);

        if (result.success) {
            toast.success(isEdit ? 'Resource updated.' : 'Resource created.');
            onOpenChange(false);
        } else {
            toast.error(result.error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Resource title" {...field} />
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
                                name="resource_type"
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
                                                <SelectItem value="link">Link</SelectItem>
                                                <SelectItem value="file">File</SelectItem>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="text">Article</SelectItem>
                                            </SelectContent>
                                        </Select>
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

                        {watchedType !== 'text' && (
                            <FormField
                                control={form.control}
                                name="content_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL</FormLabel>
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
                        )}

                        {watchedType === 'text' && (
                            <FormField
                                control={form.control}
                                name="content_text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Article content..."
                                                rows={6}
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

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
