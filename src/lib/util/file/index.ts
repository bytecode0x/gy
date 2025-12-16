import axios from 'axios'
import fs from 'fs'
import mime from 'mime-types'
import path from 'path'
import { filterMeta } from '../string'

export function makeDir(dirPath: string) {
  const { dir, base } = path.parse(dirPath)
  const filtered = `${dir}/${filterMeta(base)}`

  if (!fs.existsSync(filtered)) fs.mkdirSync(filtered, { recursive: true })

  return filtered
}

export function appendOnExist(file: string) {
  const { dir, ext } = path.parse(file)
  let { name } = path.parse(file)

  while (fs.existsSync(`${dir || '.'}/${name}${ext}`)) {
    const res = /^.+\((?<number>\d+)\)$/.exec(name)
    if (res?.groups) {
      const { number } = res.groups
      // $1 refers to first group
      name = name.replace(/(.+)\(\d+\)$/, `$1(${parseInt(number, 10) + 1})`)
    } else {
      name = name.concat('(1)')
    }
  }
  return dir ? `${dir}/${name}${ext}` : `${name}${ext}`
}

export async function getResource({
  dir,
  fileName,
  src,
  retries = 3,
  wait = 60
}: {
  dir: string
  fileName: string
  src: string
  retries?: number
  wait?: number
}): Promise<string> {
  if (!retries) return ''

  const res = await axios({
    url: src,
    method: 'get',
    timeout: 15 * 1000,
    responseType: 'stream'
  })

  if (res.status !== 200) return getResource({ dir, fileName, src, retries: retries - 1, wait })

  return new Promise<string>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => resolve(''), wait * 1000)

    try {
      const contentType = res.headers['content-type'] ?? ''
      const ext = mime.extension(contentType) || ''

      if (!ext) throw new Error('GET_RESOURCE:FAILED_TO_PARSE_EXTENSION')

      const fullPath = `${dir}/${fileName}.${ext}`

      const file = fs.createWriteStream(fullPath)

      file.once('finish', () => {
        globalThis.clearTimeout(timer)
        resolve(fullPath)
      })

      file.once('error', (err) => {
        globalThis.clearTimeout(timer)
        reject(err)
      })

      res.data.pipe(file)
    } catch (err) {
      globalThis.clearTimeout(timer)
      reject(err)
    }
  })
}
// export async function mergeImages(images: Array<string>, file: string) {
//   return joinImages(images, { color: 'white', align: 'center', direction: 'vertical' }).then((sharp) =>
//     sharp.jpeg().toFile(file)
//   )
// }

// export function validateImage(path: string) {
//   return sharp(path)
//     .metadata()
//     .then(({ width, height }) => {
//       if (!width || !height) return false
//       return true
//     })
// }
