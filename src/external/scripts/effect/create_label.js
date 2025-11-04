/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const text = neo.stringify(edward.topDownSearch({ tree, key: 'text' }))

const { edit_image_test$urls, edit_image_test$ids } = await consume({
  action: {
    template: 'EDIT_IMAGE',
    id: '',
    name: 'edit_image_test',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EditImage['value'] } */
    value: {
      imageUrls: [
        `data:image/svg+xml, ${encodeURIComponent(
          /* HTML */
          `<svg xmlns="http://www.w3.org/2000/svg" width="${150}px" height="${150}px">
            <foreignObject width="100%" height="100%"
              ><div xmlns="http://www.w3.org/1999/xhtml">
                <div
                  style="width:150px;height:150px;border-radius:50%;background:#e0e0e0;display:flex;justify-content:center;align-items:center;"
                >
                  <div
                    style="font-size:24px;width:100px;height:100px;border-radius:50%;background:#e0e0e0;display:flex;justify-content:center;align-items:center;font-weight:bold;color:#333;box-shadow:inset -2px -2px 4px #ffffff,inset 2px 2px 4px #b0b0b0;"
                  >
                    ${text}
                  </div>
                </div>
              </div></foreignObject
            >
          </svg>`
        )}`,
        `data:image/svg+xml, ${encodeURIComponent(
          /* HTML */
          `<svg xmlns="http://www.w3.org/2000/svg" width="${150}px" height="${150}px">
            <foreignObject width="100%" height="100%"
              ><div xmlns="http://www.w3.org/1999/xhtml">
                <div
                  style="width:150px;height:150px;border-radius:50%;background:#555;display:flex;justify-content:center;align-items:center;"
                >
                  <div
                    style="font-size:24px;width:100px;height:100px;border-radius:50%;background:#555;display:flex;justify-content:center;align-items:center;font-weight:bold;color:#eee;box-shadow:inset -3px -3px 6px #777,inset 3px 3px 6px #333;"
                  >
                    ${text}
                  </div>
                </div>
              </div></foreignObject
            >
          </svg>`
        )}`
      ],
      imageIds: [`white_${text}`, `black_${text}`],
      title: 'test'
    }
  }
})

// const workdir = neo.stringify(edward.topDownSearch({ key: 'WORK_DIR', tree })) || neo.stringify(edward.topDownSearch({ key: 'workdir', tree }))

const workdir = 'C:\\Users\\user\\Desktop\\label'

/** @type { Array<Record<string, string>> } */
const dataUrls = edit_image_test$urls.flat()

const ids = edit_image_test$ids.flat()

const p = /^data:image\/\w+;base64,(?<dataUrl>.+)$/

await Promise.all(
  dataUrls.map((v, i) =>
    sharp(Buffer.from(p.exec(v).groups.dataUrl, 'base64')).toFile(path.join(workdir, `${ids[i]}.png`))
  )
)
