import type { Env } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

function getImageDimensions(buffer: ArrayBuffer): { width: number; height: number } | null {
  const view = new DataView(buffer)
  const arr = new Uint8Array(buffer)

  // PNG: first 8 bytes are signature, then IHDR chunk at offset 16
  if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
    const width = view.getUint32(16)
    const height = view.getUint32(20)
    return { width, height }
  }

  // JPEG: scan for SOF0 (0xFF 0xC0) or SOF2 (0xFF 0xC2) marker
  if (arr[0] === 0xFF && arr[1] === 0xD8) {
    let offset = 2
    while (offset < arr.length) {
      if (arr[offset] !== 0xFF) break
      const marker = arr[offset + 1]
      if (marker === 0xC0 || marker === 0xC2) {
        const height = view.getUint16(offset + 5)
        const width = view.getUint16(offset + 7)
        return { width, height }
      }
      const segmentLength = view.getUint16(offset + 2) + 2
      offset += segmentLength
    }
  }

  // WebP: RIFF container, VP8 chunk at offset 12
  if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) {
    // VP8 (lossy): width/height stored as 14-bit LE at offset 26
    // VP8L (lossless): stored as 14-bit LE at offset 25
    // VP8X (extended): stored as 24-bit LE at offset 24
    if (arr[12] === 0x56 && arr[13] === 0x50 && arr[14] === 0x38 && arr[15] === 0x20) {
      const w = view.getUint16(26, true) & 0x3FFF
      const h = view.getUint16(28, true) & 0x3FFF
      return { width: w, height: h }
    }
    if (arr[12] === 0x56 && arr[13] === 0x50 && arr[14] === 0x38 && arr[15] === 0x4C) {
      const bits = view.getUint32(21, true)
      const w = (bits & 0x3FFF) + 1
      const h = ((bits >> 14) & 0x3FFF) + 1
      return { width: w, height: h }
    }
    if (arr[12] === 0x56 && arr[13] === 0x50 && arr[14] === 0x38 && arr[15] === 0x58) {
      const w = view.getUint32(24, true) & 0xFFFFFF
      const h = view.getUint32(27, true) & 0xFFFFFF
      return { width: w + 1, height: h + 1 }
    }
  }

  return null
}

export async function validateAndUploadImage(
  file: File,
  env: Env
): Promise<{ imageKey: string; imageUrl: string }> {
  const buffer = await file.arrayBuffer()

  // Validate aspect ratio (4:3, ~1.333, tolerance 2%)
  const dims = getImageDimensions(buffer)
  if (!dims) {
    throw new Error('无法解析图片尺寸，请确保上传有效的 PNG/JPEG/WebP 图片')
  }

  const ratio = dims.width / dims.height
  const targetRatio = 4 / 3 // ~1.333
  if (Math.abs(ratio - targetRatio) > 0.03) {
    throw new Error(
      `图片比例必须为 4:3（宽:高 ≈ 1.33），当前图片为 ${dims.width}x${dims.height}（比例 ${ratio.toFixed(2)}）`
    )
  }

  // Determine file extension
  let ext = '.webp'
  const fileType = file.type.toLowerCase()
  if (fileType === 'image/png') ext = '.png'
  else if (fileType === 'image/jpeg') ext = '.jpg'
  else if (fileType === 'image/webp') ext = '.webp'

  const imageKey = `cards/${generateId()}${ext}`

  // Upload to R2
  await env.CARD_IMAGES.put(imageKey, buffer, {
    httpMetadata: {
      contentType: file.type || 'image/webp',
      cacheControl: 'public, max-age=31536000',
    },
  })

  const imageUrl = `${env.R2_PUBLIC_URL}/${imageKey}`

  return { imageKey, imageUrl }
}

export async function deleteImage(imageKey: string, env: Env): Promise<void> {
  await env.CARD_IMAGES.delete(imageKey)
}
