import crypto from 'crypto'
import fs from 'fs'

export function getContentHash(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex')
}

export function synchronizeStore() {}

export function measureUp(filePath: string) {
  return new Promise<number>(function (resolve, reject) {
    fs.stat(filePath, function (err, stats) {
      if (err) return reject(err)
      resolve(stats.size)
    })
  })
}

export function parseMeta(comments: string) {
  const p = /(?<entry>@(required|optional)\s*:\s*\[(\w[\w\d]*\s*,?\s*)*\])/g

  let entry = p.exec(comments)?.groups?.entry?.split(':')

  const meta: Record<string, Array<string>> = {}

  if (!entry) return meta

  while (entry) {
    const key = entry[0].trim().slice(1)
    const value = entry[1]
      .trim()
      .slice(1, -1)
      .split(',')
      .map((v) => v.trim())
    meta[key] = value
    entry = p.exec(comments)?.groups?.entry?.split(':')
  }

  return meta
}
