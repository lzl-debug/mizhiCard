import { mkdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ImageStore } from '../types'

export function createFilesystemAdapter(baseDir: string): ImageStore {
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true })
  }

  return {
    async put(key: string, value: ArrayBuffer | Uint8Array, options?: { metadata?: Record<string, unknown> }): Promise<void> {
      const filePath = join(baseDir, key)
      const buf = value instanceof Uint8Array ? value : new Uint8Array(value)
      writeFileSync(filePath, buf)

      if (options?.metadata) {
        const metaPath = filePath + '.meta.json'
        writeFileSync(metaPath, JSON.stringify(options.metadata))
      }
    },

    async getWithMetadata(key: string, _type: 'arrayBuffer'): Promise<{ value: ArrayBuffer | null; metadata: Record<string, unknown> | null }> {
      const filePath = join(baseDir, key)
      if (!existsSync(filePath)) {
        return { value: null, metadata: null }
      }

      const buf = readFileSync(filePath)
      const arrayBuf = new Uint8Array(buf).buffer

      let metadata = null
      const metaPath = filePath + '.meta.json'
      if (existsSync(metaPath)) {
        metadata = JSON.parse(readFileSync(metaPath, 'utf-8'))
      }

      return { value: arrayBuf, metadata }
    },

    async delete(key: string): Promise<void> {
      const filePath = join(baseDir, key)
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
      const metaPath = filePath + '.meta.json'
      if (existsSync(metaPath)) {
        unlinkSync(metaPath)
      }
    }
  }
}
