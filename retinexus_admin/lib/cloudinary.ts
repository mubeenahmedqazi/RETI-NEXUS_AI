import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Recovers a Cloudinary public_id (folder/filename, no version, no extension) from one of
 * this app's own secure_urls — that's all `destroy()` needs, and no report row stores the
 * public_id for anything but its "enhanced" image, so every other image's id is derived
 * from the URL itself rather than requiring a schema change. Returns null for anything that
 * isn't actually a Cloudinary URL (a pre-Cloudinary report's local backend filenames). */
export function extractCloudinaryPublicId(url: string | undefined | null): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+(?:$|\?)/);
  return match ? match[1] : null;
}

/** Best-effort delete of a batch of Cloudinary images by public_id — used when a report
 * (or anything else holding Cloudinary images) is deleted from Neon. Never throws: the
 * Neon deletion is the source of truth and always proceeds regardless of Cloudinary's
 * outcome, matching the same best-effort-cleanup pattern as lib/firebaseAdmin.ts. */
export async function deleteCloudinaryImages(publicIds: string[]): Promise<{ deleted: number; failed: number }> {
  const ids = [...new Set(publicIds.filter(Boolean))];
  if (ids.length === 0) return { deleted: 0, failed: 0 };

  try {
    const result = await cloudinary.api.delete_resources(ids);
    const deleted = Object.values(result.deleted || {}).filter((status) => status === 'deleted').length;
    return { deleted, failed: ids.length - deleted };
  } catch (err) {
    console.error('Cloudinary bulk delete failed:', err);
    return { deleted: 0, failed: ids.length };
  }
}

export default cloudinary;
