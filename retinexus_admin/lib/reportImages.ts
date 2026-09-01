// Every scan used to write its 4 output images to these same fixed filenames, so each new
// scan silently overwrote the previous one's files on disk — every report saved before that
// was fixed has an `images` object that still points at one of these names, but the actual
// file on disk is now frozen at whatever the last pre-fix scan produced, not this report's
// own image. Showing that as if it belonged to this report would be actively misleading, so
// these are always treated as unavailable instead.
const LEGACY_SHARED_IMAGE_FILENAMES = new Set([
  'enhanced_input.png',
  'vessel_mask.png',
  'detected_lesions.png',
  'gradcam_explainability.png',
]);

/** Builds the backend's /output_results URL for a saved report image, or null when the
 * image is missing, failed, or is one of the known pre-fix shared/overwritten filenames.
 * Once a report is approved, its images are uploaded to Cloudinary and the report's
 * `images` object holds full URLs instead of bare filenames — those are returned as-is. */
export function getReportImageUrl(filename: string | undefined | null, apiBaseUrl: string): string | null {
  if (!filename || filename === 'Failed' || filename === 'None' || filename === 'null') return null;
  if (/^https?:\/\//i.test(filename)) return filename;
  const cleanFilename = filename.replace(/^.*[\\/]/, '');
  if (LEGACY_SHARED_IMAGE_FILENAMES.has(cleanFilename)) return null;
  return `${apiBaseUrl}/output_results/${cleanFilename}`;
}
