/** @type { import('C:\\Users\\user\\AppData\\Roaming\\gy-test\\plugins\\googleapis').drive_v3.Drive } */
const g_drive = context.g_drive

if (!g_drive) throw new Error('NO_G_DRIVE')

// create file
const file = await g_drive.files.create({
  requestBody: { name: `test.png`, parents: ['root'] },
  media: {
    mimeType: 'image/png',
    body: stream.Readable.from(
      Buffer.from(
        await fetch(
          'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQuJj8J38pmnQazkotuGKGhUfS3hLW8PmTmgDrhpwZxt_BCfI2shpsnKn3F_Njftx4XnZPb0IKIXkdjq1oRtxpqJRro45Z6N1QiiOGFIeT1Og'
        ).then((r) => r.arrayBuffer())
      )
    )
  },
  fields: 'id, webViewLink, webContentLink'
})

// config permission
await g_drive.permissions.create({ fileId: file.data.id, requestBody: { role: 'reader', type: 'anyone' } })

await log({ msg: { link: file.data.webViewLink } })
