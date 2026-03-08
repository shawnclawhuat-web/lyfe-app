/**
 * Shared Supabase mock instance — imported by test files, also used
 * by the jest.mock factory in lib/__mocks__/supabase.ts
 */
import { createMockSupabase } from '../__tests__/fixtures/mockSupabase';

export const supabase = createMockSupabase();
