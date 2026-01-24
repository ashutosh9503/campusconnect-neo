
import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts the file path from a Supabase Storage public URL.
 * @param url The public URL of the file.
 * @param bucket The storage bucket name.
 * @returns The file path relative to the bucket, or null if invalid.
 */
export const extractFilePathFromUrl = (url: string, bucket: string): string | null => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        // Path structure: /storage/v1/object/public/{bucket}/{path}
        // OR: /storage/v1/object/public/{bucket}/{folder}/{file}

        // We need to match the part after `/public/{bucket}/`
        const updatedUrl = decodeURIComponent(url);
        const splitKey = `/public/${bucket}/`;
        const parts = updatedUrl.split(splitKey);

        if (parts.length > 1) {
            return parts[1];
        }

        // Fallback for different URL structures (e.g., custom domains?)
        // If usage implies simply storing the filename in some cases, we need to be careful. 
        // But standard Supabase `getPublicUrl` returns the standard format.
        return null;
    } catch (e) {
        console.error("Error parsing URL:", e);
        return null;
    }
};

/**
 * Deletes a file from Supabase Storage.
 * @param bucket The storage bucket name.
 * @param path The file path relative to the bucket.
 */
export const deleteStorageFile = async (bucket: string, path: string) => {
    if (!path) return;
    console.log(`[Storage Cleanup] Deleting ${path} from ${bucket}`);

    try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
            console.error(`[Storage Cleanup] Failed to delete ${path} from ${bucket}:`, error);
            // We log but don't throw, to prevent blocking DB operations if storage fails?
            // User requirement: "Log failures... Do not crash UI if deletion fails"
        } else {
            console.log(`[Storage Cleanup] Successfully deleted ${path}`);
        }
    } catch (err) {
        console.error(`[Storage Cleanup] Unexpected error deleting ${path}:`, err);
    }
};
