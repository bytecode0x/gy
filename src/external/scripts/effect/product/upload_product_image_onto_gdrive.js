/** @type { import('C:\\Users\\user\\AppData\\Roaming\\gy-test\\plugins\\googleapis').drive_v3.Drive } */
const g_drive = context.g_drive

if (!g_drive) throw new Error('NO_G_DRIVE')

const { images, product } = context

if (!product || !images) throw new Error('NO_CONTEXT')

const p = /^data:image\/\w+;base64,(?<dataUrl>.+)$/

const dir = `product/image/${product.id}`

const folderId = await assertFolder(g_drive, dir)

const image_web_urls = await Promise.all(
  images.map(async function ({ url, name }, i) {
    // create file
    const file = await g_drive.files.create({
      requestBody: { name: `${name}.png`, parents: [folderId] },
      media: { mimeType: 'image/png', body: stream.Readable.from(Buffer.from(p.exec(url).groups.dataUrl, 'base64')) },
      fields: 'id, webViewLink, webContentLink'
    })

    // config permission
    await g_drive.permissions.create({ fileId: file.data.id, requestBody: { role: 'reader', type: 'anyone' } })

    return `https://lh3.googleusercontent.com/d/${file.data.id}?authuser=0`
  })
)

await log({ msg: { image_web_urls } })

Object.assign(context, { image_web_urls })

async function assertFolder(drive, folderPath) {
  const partial = folderPath.split('/').filter(Boolean) // ['A','B','C']
  let currentParent = 'root'

  for (const name of partial) {
    // 폴더 검색
    const res = await drive.files.list({
      q: [
        `'${currentParent}' in parents`,
        `name = '${name}'`,
        `mimeType = 'application/vnd.google-apps.folder'`,
        'trashed = false'
      ].join(' and '),
      fields: 'files(id, name)',
      spaces: 'drive'
    })

    let folderId
    if (res.data.files && res.data.files.length) {
      // 이미 존재하는 폴더
      folderId = res.data.files[0].id
    } else {
      // 새 폴더 생성
      const folder = await drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentParent]
        },
        fields: 'id'
      })
      folderId = folder.data.id
    }

    currentParent = folderId
  }

  return currentParent
}
