/// <reference path="../../effect-runtime.d.ts" />

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const workdir = neo.stringify(edward.topDownSearch({ key: 'workdir', tree }))

// make product dir
fs.mkdirSync(workdir, { recursive: true })

const name = neo.stringify(edward.topDownSearch({ key: 'name', tree })) || Date.now().toString()

const p = /^data:image\/\w+;base64,(?<dataUrl>.+)$/

await sharp(
  Buffer.from(p.exec(neo.stringify(edward.topDownSearch({ key: 'label_base64', tree }))).groups.dataUrl, 'base64')
)
  .png()
  .toFile(path.join(workdir, name + '.png'))
