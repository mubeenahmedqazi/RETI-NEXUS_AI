import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Cloudinary's free-tier plan caps a single source file at 10MB — a couple of the pipeline's
// annotated output images (lesion-box overlays, the enhanced fundus view) come in just over
// that. Leave some headroom under the real cap rather than cutting it exactly at 10MB.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 - 200_000

async function compressIfNeeded(buffer: Buffer, contentType: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (buffer.length <= MAX_UPLOAD_BYTES) return { buffer, contentType }
  // Re-encode as JPEG — a large, reliable size cut for photographic/gradient content (fundus
  // photos, heatmaps) with no visible quality loss at this quality level for a report image.
  const jpeg = await sharp(buffer).jpeg({ quality: 85 }).toBuffer()
  return { buffer: jpeg, contentType: 'image/jpeg' }
}

// Cloudinary's remote-URL upload has its OWN servers fetch `imagePath` — which never works
// for a backend URL like http://127.0.0.1:8001/... since that loopback address means
// nothing outside whichever machine issues the request (not Cloudinary's infrastructure).
// Fetching the bytes here (from this Next.js server, which — as long as it's running on the
// same machine as the backend — can actually reach 127.0.0.1) and uploading them directly
// as a data URI sidesteps that entirely.
export async function uploadToCloudinary(imagePath: string) {
  const response = await fetch(imagePath)
  if (!response.ok) throw new Error(`Failed to fetch source image (${response.status})`)
  const rawBuffer = Buffer.from(await response.arrayBuffer())
  const rawContentType = response.headers.get('content-type') || 'image/png'
  const { buffer, contentType } = await compressIfNeeded(rawBuffer, rawContentType)
  const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`

  // One retry with a short backoff — Cloudinary's accept-the-upload step occasionally times
  // out on a large file over a slow connection; a single retry clears that without the
  // caller (report approval) needing its own retry logic for what's usually transient.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'retinexus/reports',
        resource_type: 'image',
      })
      return {
        url: result.secure_url,
        publicId: result.public_id,
      }
    } catch (error) {
      console.error(`Cloudinary upload error (attempt ${attempt}/2):`, error)
      if (attempt === 2) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error('unreachable')
}

export default cloudinary