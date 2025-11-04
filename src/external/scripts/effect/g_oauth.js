if (context.g_oauth) return

/** @type { import('C:\\Users\\user\\AppData\\Roaming\\gy-test\\plugins\\googleapis') } */
const g = importPlugin('googleapis')

// '1078321222779-nq13krq6tqek68eqs6vvut0pfbc57pkq.apps.googleusercontent.com'
const clientId = String.fromCodePoint(
  ...[
    49, 48, 55, 56, 51, 50, 49, 50, 50, 50, 55, 55, 57, 45, 110, 113, 49, 51, 107, 114, 113, 54, 116, 113, 101, 107, 54,
    56, 101, 113, 115, 54, 118, 118, 117, 116, 48, 112, 102, 98, 99, 53, 55, 112, 107, 113, 46, 97, 112, 112, 115, 46,
    103, 111, 111, 103, 108, 101, 117, 115, 101, 114, 99, 111, 110, 116, 101, 110, 116, 46, 99, 111, 109
  ]
)
// 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
const clientSecret = String.fromCodePoint(
  ...[
    71, 79, 67, 83, 80, 88, 45, 80, 87, 109, 102, 115, 89, 79, 117, 57, 90, 114, 89, 78, 108, 79, 51, 49, 57, 50, 88,
    72, 80, 71, 98, 78, 53, 113, 122
  ]
)
// http://localhost:15171/fulfill?channel=oauth
const redirectUri = String.fromCodePoint(
  ...[
    104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 49, 53, 49, 55, 49, 47, 102, 117,
    108, 102, 105, 108, 108, 63, 99, 104, 97, 110, 110, 101, 108, 61, 111, 97, 117, 116, 104
  ]
)

// 180170d3-bbb2-4c25-a307-4cc9debaaaa0
const g_oauth = new g.Auth.OAuth2Client({ clientId, clientSecret, redirectUri })

const g_credentials = await getGdr({ substitute: 'g_credentials' })

let credentials = g_credentials ? neo.fromMatrix(g_credentials) : null

await log({ msg: { credentials } })

if (!credentials || !credentials.refresh_token) {
  await authWithWeb()
} else {
  g_oauth.setCredentials(credentials)
  // await g_oauth.refreshAccessToken()
}

if (Date.now() > credentials?.expiry_date)
  try {
    await g_oauth.refreshAccessToken().then(async function ({ credentials: new_credentials }) {
      await log({ msg: { new_credentials } })
      credentials = new_credentials
      g_oauth.setCredentials(credentials)
      return setGdr({ substitute: 'g_credentials', value: neo.toMatrix(credentials) })
    })
  } catch (err) {
    await log({ msg: { err } })

    // on refresh token expiration
    await authWithWeb()
  }

Object.assign(context, { g_oauth })

function assertExpiration(credentials) {
  return !credentials.expiry_date || credentials.expiry_date > Date.now()
}

/**
 * change from handling with renderer to handling with deep link which contains the message channel and message data
 * so that preload can get it through piping to main
 */

async function authWithWeb() {
  const url = g_oauth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
    // without prompt with consent, It will return no refresh token
    prompt: 'consent'
  })
  logger.info('auth url: ', { source: 'g_oauth', url })

  open(url)

  await expect('oauth').then(async function (serialized) {
    const data = JSON.parse(serialized)
    logger.info('fulfilled: ', { source: 'g_oauth', serialized, data })

    return g_oauth.getToken(data.code).then(function ({ tokens }) {
      credentials = tokens
      g_oauth.setCredentials(credentials)
      return setGdr({ substitute: 'g_credentials', value: neo.toMatrix(credentials) })
    })
  })
}
