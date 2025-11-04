const MAX_CONTENT_LIMIT_SINGLE_CELL = 50000

/** @type { SheetData } */
// const sheetData = getStorageItem({ key: 'sheetData' })
const sheetData = context['sheetData']

if (!sheetData) {
    throw new Error("NO_SHEET_DATA_PROVIDED")
//   return console.log('no sheet data provided')
}

// console.log('spreadsheets data: ', data)

/** @type { import('external/plugin/googleapis/oauth') } */
const oauth = importPlugin('oauth')
/** @type { import('external/plugin/googleapis/sheets') } */
const sheets = importPlugin('sheets')

const gdr = await getGdr()

/** @type { Parameters<oauth['initializeOAuthClient']>[0] } */
let credentials = gdr.g_credentials ? neo.fromMatrix(gdr.g_credentials) : ''

// const icr = stringify(cdr.spreadsheet_icr)
// const contextRecord = icr && gdr[icr] ? fromMatrix(gdr[icr]) : {}
// const rowMap = Object.fromEntries(cdr.spreadsheet_row_map)
// const keys = Object.keys(rowMap)
// const headers = keys.map((key) => rowMap[key])

// console.log('contextRecord: ', contextRecord, '\nicr: ', icr, '\nrowMap: ', rowMap)

const oauthClient = oauth.initializeOAuthClient()

oauthClient.once('tokens', async function (credentials) {
  console.log('got a token: ', credentials)
  /**
   * if you set gdr this scope
   * It would overwrite without refresh token
   */
})

async function authWithWeb() {
  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
    // without prompt with consent, It will return no refresh token
    prompt: 'consent'
  })
  console.log('auth url: ', url)

  open(url)

  await expect('oauth').then(async function (serialized) {
    const data = JSON.parse(serialized)
    console.log('fulfilled: ', serialized, data)

    return oauthClient.getToken(data.code).then(function ({ tokens }) {
      credentials = tokens
      oauthClient.setCredentials(credentials)
      return setGdr({ key: 'g_credentials', matrix: neo.toMatrix(credentials) })
    })
  })
}

if (!credentials || !credentials.refresh_token) {
  await authWithWeb()
} else if (!oauthClient.credentials) {
  oauthClient.setCredentials(credentials)
  // await oauthClient.refreshAccessToken()
}

if (Date.now() > oauthClient.credentials.expiry_date)
  try {
    await oauthClient.refreshAccessToken().catch(function () {
      return oauthClient.getToken(data.code).then(function ({ tokens }) {
        credentials = tokens
        oauthClient.setCredentials(credentials)
        return setGdr({ key: 'g_credentials', matrix: neo.toMatrix(credentials) })
      })
    })
  } catch (err) {
    await authWithWeb()
  }

const { spreadsheets } = sheets.getSheets() || sheets.initSpreadSheets(oauthClient)

/** @type { Array<{ title: string; sheetId: string }> } */
const $sheets = data.spreadsheetId
  ? await spreadsheets.get({ spreadsheetId: data.spreadsheetId }).then(function (r) {
      // console.log('r: ', r)
      return r.data.sheets.map((s) => ({ title: s.properties.title, id: s.properties.sheetId }))
    })
  : []

console.log('$sheets: ', $sheets)

const newSheets = data.spreadsheetId
  ? data.sheets.filter((s) => $sheets.every(($s) => $s.title !== s.title))
  : data.sheets

console.log('new sheets to add: ', newSheets)

const spreadsheetId =
  data.spreadsheetId ||
  (await spreadsheets
    .create({
      requestBody: {
        properties: { title: data.title },
        /**
         * It's better make it generate sheet id automatically
         */
        sheets: data.sheets.map((s, i) => ({ properties: { title: s.title || `sheet${i + 1}`, sheetId: s.id } }))
      }
    })
    .then((r) => r.data.spreadsheetId))

console.log('spreadsheetId: ', spreadsheetId)

if (newSheets.length) {
  // add sheet separately if the spreadsheet existed already
  if (data.spreadsheetId) {
    await spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: newSheets.map((s) => ({ addSheet: { properties: { title: s.title } } }))
      }
    })
  }

  // insert headers in new sheets
  await Promise.all(
    newSheets.map((s) =>
      spreadsheets.values.append({
        spreadsheetId,
        range: `${s.title}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          majorDimension: 'ROWS',
          values: data.sheets.find(($s) => $s.title === s.title).headers
        }
      })
    )
  )
}

// appending rows
await Promise.all(
  data.sheets
    .filter((s) => s.matrix.length > 0)
    .map(function (s) {
      // @ts-ignore
      return spreadsheets.values.append({
        spreadsheetId,
        range: `${s.title}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          majorDimension: 'ROWS',
          values: s.matrix.map((row) =>
            row.map((v) => (typeof v === 'string' ? v.slice(0, MAX_CONTENT_LIMIT_SINGLE_CELL) : v))
          )
        }
      })
    })
)

const rowsAddedSheets = await spreadsheets.get({ spreadsheetId }).then((r) =>
  // r.data.sheets.filter((s) => data.sheets.some((_) => _.id === s.properties.id)).map((s) => s.properties.sheetId)
  r.data.sheets.filter((s) => data.sheets.some((_) => _.title === s.properties.title)).map((s) => s.properties.sheetId)
)
// align, wrap strategy should be applied after appending rows
if (rowsAddedSheets.length)
  await spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: rowsAddedSheets.flatMap((sheetId) => [
        {
          updateDimensionProperties: {
            properties: { pixelSize: 21 },
            range: { dimension: 'ROWS', startIndex: 0, sheetId },
            fields: 'pixelSize'
          }
        },
        {
          repeatCell: {
            range: {
              sheetId
            },
            cell: {
              userEnteredFormat: {
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                wrapStrategy: 'CLIP'
              }
            },
            fields: 'userEnteredFormat(horizontalAlignment, verticalAlignment, wrapStrategy)'
          }
        }
      ])
    }
  })

await fulfill({ channel: 'spreadsheetId', target: 'self', value: spreadsheetId })

Object.assign(context, { spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` })

// return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
