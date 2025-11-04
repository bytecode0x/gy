const gTranslate = require('node-google-translate-skidz')

function translate({text, source = 'zh-cn', target = 'ko'}) {
    if (text.length === 0) return ''
    return new Promise((resolve, reject) => {
        try {
            gTranslate(
                {
                text,
                source,
                target
                },
                function ({ translation }) {
                return resolve(translation)
                }
            )
        } catch (e) {
        return reject(e)
        }
    })
}


module.exports = translate