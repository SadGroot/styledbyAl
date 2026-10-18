import { statfs, mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

export const mediaDir = path.resolve(process.env.MEDIA_DIR || './data/media')
export const reserveBytes = 1024 ** 3
export const mediaBudget = 2 * 1024 ** 3
export function hasUploadSpace(available: number, inputBytes: number, used = 0) {
  return available - inputBytes * 4 > reserveBytes && used + inputBytes * 4 <= mediaBudget
}
export async function storageUsage() {
  await mkdir(mediaDir, { recursive: true })
  const disk = await statfs(mediaDir)
  let used = 0
  for (const file of await readdir(mediaDir)) {
    const info = await stat(path.join(mediaDir, file))
    if (info.isFile()) used += info.size
  }
  return { available: disk.bavail * disk.bsize, used }
}
