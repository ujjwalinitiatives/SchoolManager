import { put, del } from "@vercel/blob";

/**
 * Uploads a file buffer to Vercel Blob storage.
 * @param fileName - The name of the file (e.g. 'INV-2026-000001.pdf')
 * @param buffer - The file buffer to upload
 * @param folder - Optional folder prefix (e.g. 'invoices' or 'receipts')
 * @returns The public URL of the uploaded blob
 */
export async function uploadPdf(fileName: string, buffer: Buffer, folder: string = "pdfs"): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("BLOB_READ_WRITE_TOKEN is not set. Uploading will fail in production.");
    // For local dev without vercel blob, we could just return a mock URL
    // return `https://mock-storage.local/${folder}/${fileName}`;
  }

  const blob = await put(`${folder}/${fileName}`, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
  });

  return blob.url;
}

/**
 * Deletes a file from Vercel Blob storage by URL.
 */
export async function deletePdf(url: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(url);
}
