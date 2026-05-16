import type { Env } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

function getImageDimensions(buffer: ArrayBuffer): { width: number; height: number } | null {
  const view = new DataView(buffer)
  const arr = new Uint8Array(buffer)

  if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
    const width = view.getUint32(16)
    const height = view.getUint32(20)
    return { width, height }
  }

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

  if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) {
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
): Promise<{ imageKey: string; imageUrl: string; contentType: string }> {
  const buffer = await file.arrayBuffer()

  const dims = getImageDimensions(buffer)
  if (!dims) {
    throw new Error('无法解析图片尺寸，请确保上传有效的 PNG/JPEG/WebP 图片')
  }

  const ratio = dims.width / dims.height
  const targetRatio = 4 / 3
  if (Math.abs(ratio - targetRatio) > 0.03) {
    throw new Error(
      `图片比例必须为 4:3（宽:高 ≈ 1.33），当前图片为 ${dims.width}x${dims.height}（比例 ${ratio.toFixed(2)}）`
    )
  }

  let ext = '.webp'
  const fileType = file.type.toLowerCase()
  if (fileType === 'image/png') ext = '.png'
  else if (fileType === 'image/jpeg') ext = '.jpg'
  else if (fileType === 'image/webp') ext = '.webp'

  const imageKey = `${generateId()}${ext}`

  // Store in KV with content-type metadata
  const metadata = { contentType: fileType || 'image/webp' }
  await env.CARD_IMAGES.put(imageKey, buffer, { metadata })

  // Image URL is served via /api/images/:key
  const imageUrl = `/api/images/${imageKey}`

  return { imageKey, imageUrl, contentType: fileType || 'image/webp' }
}

export async function deleteImage(imageKey: string, env: Env): Promise<void> {
  await env.CARD_IMAGES.delete(imageKey)
}

export async function getImage(
  imageKey: string,
  env: Env
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const { value, metadata } = await env.CARD_IMAGES.getWithMetadata(imageKey, 'arrayBuffer')
  if (!value) return null

  const contentType =
    (metadata as { contentType?: string } | null)?.contentType || 'image/webp'

  return { data: value as ArrayBuffer, contentType }
}
