import axios from 'axios'
import fs from 'fs'
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

export async function getResource(dir: string, fileName: string, src: string, retries = 3, wait = 60): Promise<string> {
  if (!retries) return ''

  let extension: string

  const res = await axios({ url: src, method: 'get', timeout: 15 * 1000 })

  if (res.status !== 200) return getResource(dir, fileName, src, retries - 1)

  return new Promise<string>((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => resolve(''), wait * 1000)
    try {
      switch (res.headers['content-type']) {
        case 'image/jpeg':
          extension = 'jpg'
          break
        case 'image/png':
          extension = 'png'
          break
        case 'image/gif':
          extension = 'gif'
          break
        case 'video/mp4':
          extension = 'mp4'
          break
        case 'video/x-flv':
          extension = 'flv'
          break
        case 'video/x-msvideo':
          extension = 'avi'
          break
        case 'video/x-ms-wmv':
          extension = 'wmv'
          break
        default:
          extension = res.headers['content-type'].split('/')[1].split('-').pop() || ''
          // reject(new Error('INVALID_TYPE'))
          break
      }

      const file = fs.createWriteStream(`${dir}/${fileName}.${extension}`)
      file.once('finish', () => {
        globalThis.clearTimeout(timeout)
        resolve(`${dir}/${fileName}.${extension}`)
      })
      file.once('error', (err) => reject(err))
      res.data.pipe(file)
    } catch (err) {
      reject(err)
    }
  })
}

// filter outside
// promt and count on resolve
export async function getImage(filePath: string, fileName: string, src: string) {
  let extension: string

  const res = await axios({ url: src, method: 'get', responseType: 'stream', timeout: 10 * 1000 })

  return new Promise<string>((resolve, reject) => {
    try {
      switch (res.headers['content-type']) {
        case 'image/jpeg':
          extension = 'jpg'
          break
        case 'image/png':
          extension = 'png'
          break
        case 'image/gif':
          extension = 'gif'
          break
        case 'video/mp4':
          extension = 'mp4'
          break
        case 'video/x-flv':
          extension = 'flv'
          break
        case 'video/x-msvideo':
          extension = 'avi'
          break
        case 'video/x-ms-wmv':
          extension = 'wmv'
          break
        default:
          reject(new Error('INVALID_TYPE'))
          break
      }

      const file = fs.createWriteStream(`${filePath}/${fileName}.${extension}`)
      file.once('finish', () => resolve(`${filePath}/${fileName}.${extension}`))
      file.once('error', (err) => reject(err))
      res.data.pipe(file)
    } catch (err) {
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
