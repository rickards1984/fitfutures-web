import { supabase } from "./supabaseClient";

// Upload a file to a presigned Supabase Storage URL (token from the API's
// /v1/evidence/upload-url). The browser holds only the anon key; the signed
// token authorises this single object write.
export async function uploadToSignedUrl(
  bucket: string,
  path: string,
  token: string,
  file: File,
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (error) throw error;
}
