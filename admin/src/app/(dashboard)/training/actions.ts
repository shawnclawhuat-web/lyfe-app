'use server';

import { revalidatePath } from 'next/cache';
import { adminAction } from '@/lib/actions';
import { createServiceClient } from '@/lib/supabase/server';
import type { ProgrammeFormInput, ModuleFormInput, ResourceFormInput } from '@/lib/schemas';

// ── Programme actions ──

export async function createProgramme(data: ProgrammeFormInput) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase.from('roadmap_programmes').insert(data);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function updateProgramme(id: string, data: ProgrammeFormInput) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase.from('roadmap_programmes').update(data).eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function archiveProgramme(id: string, archivedBy: string) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('roadmap_programmes')
            .update({ archived_at: new Date().toISOString(), archived_by: archivedBy, is_active: false })
            .eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function restoreProgramme(id: string) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('roadmap_programmes')
            .update({ archived_at: null, archived_by: null, is_active: true })
            .eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function reorderProgrammes(orderedIds: string[]) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        for (let i = 0; i < orderedIds.length; i++) {
            const { error } = await supabase
                .from('roadmap_programmes')
                .update({ display_order: i })
                .eq('id', orderedIds[i]);
            if (error) throw new Error(error.message);
        }
        revalidatePath('/training');
    });
}

// ── Module actions ──

export async function createModule(data: ModuleFormInput) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase.from('roadmap_modules').insert(data);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function updateModule(id: string, data: ModuleFormInput) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase.from('roadmap_modules').update(data).eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function archiveModule(id: string, archivedBy: string) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('roadmap_modules')
            .update({ archived_at: new Date().toISOString(), archived_by: archivedBy, is_active: false })
            .eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function restoreModule(id: string) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('roadmap_modules')
            .update({ archived_at: null, archived_by: null, is_active: true })
            .eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function reorderModules(programmeId: string, orderedIds: string[]) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        for (let i = 0; i < orderedIds.length; i++) {
            const { error } = await supabase
                .from('roadmap_modules')
                .update({ display_order: i })
                .eq('id', orderedIds[i]);
            if (error) throw new Error(error.message);
        }
        revalidatePath('/training');
    });
}

export async function toggleModuleActive(id: string, isActive: boolean) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase.from('roadmap_modules').update({ is_active: isActive }).eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

// ── Prerequisite actions ──

export async function setModulePrerequisites(moduleId: string, requiredModuleIds: string[]) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        // Delete existing prerequisites for this module
        const { error: deleteError } = await supabase.from('roadmap_prerequisites').delete().eq('module_id', moduleId);
        if (deleteError) throw new Error(deleteError.message);
        // Insert new ones
        if (requiredModuleIds.length > 0) {
            const rows = requiredModuleIds.map((requiredModuleId) => ({
                module_id: moduleId,
                required_module_id: requiredModuleId,
            }));
            const { error: insertError } = await supabase.from('roadmap_prerequisites').insert(rows);
            if (insertError) throw new Error(insertError.message);
        }
        revalidatePath('/training');
    });
}

// ── Resource actions ──

export async function createResource(data: ResourceFormInput) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase.from('roadmap_resources').insert(data);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function updateResource(id: string, data: ResourceFormInput) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase.from('roadmap_resources').update(data).eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function deleteResource(id: string) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        const { error } = await supabase.from('roadmap_resources').delete().eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/training');
    });
}

export async function reorderResources(moduleId: string, orderedIds: string[]) {
    return adminAction(async () => {
        const supabase = createServiceClient();
        for (let i = 0; i < orderedIds.length; i++) {
            const { error } = await supabase
                .from('roadmap_resources')
                .update({ display_order: i })
                .eq('id', orderedIds[i]);
            if (error) throw new Error(error.message);
        }
        revalidatePath('/training');
    });
}
