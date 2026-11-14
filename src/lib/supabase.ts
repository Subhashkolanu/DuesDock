import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'placeholder-anon-key'
  );
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Resolves the OAuth redirect URL dynamically based on the current origin.
 * Automatically and explicitly supports:
 * - Local Development: http://localhost:5173/
 * - Local Production Preview: http://localhost:4173/
 * - Production Deployment: https://duesdock.vercel.app/
 */
export function getAuthRedirectTo(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, '');

    if (origin.includes('localhost:5173')) {
      return 'http://localhost:5173/';
    }
    if (origin.includes('localhost:4173')) {
      return 'http://localhost:4173/';
    }
    if (origin.includes('duesdock.vercel.app')) {
      return 'https://duesdock.vercel.app/';
    }

    return `${origin}/`;
  }

  return 'https://duesdock.vercel.app/';
}

/**
 * Initiates official Google OAuth authentication via Supabase.
 * Strictly never simulates authentication.
 */
export async function signInWithGoogle() {
  const redirectTo = getAuthRedirectTo();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Signs the user out of their Supabase session.
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Uploads a receipt image to the private 'receipts' Supabase Storage bucket.
 * Organizes files into a user-scoped folder: receipts/{userId}/{timestamp}-{random}.ext
 */
export async function uploadReceipt(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}

/**
 * Generates a temporary secure signed URL (1 hour) for private receipt viewing.
 */
export async function getReceiptSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, 3600);

  if (error) {
    console.error('Error generating signed URL for receipt:', error);
    return null;
  }
  return data.signedUrl;
}
