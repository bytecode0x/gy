import crypto from 'crypto'

export function getContentHash(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex')
}
