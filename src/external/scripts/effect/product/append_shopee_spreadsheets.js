/** @type { import('C:\\Users\\user\\AppData\\Roaming\\gy-test\\plugins\\googleapis').sheets_v4.Sheets } */
const g_sheets = context.g_sheets

if (!g_sheets) throw new Error('NO_G_SHEETS')

/** @type { Product } */
const { product, shopee_beauty_template_row } = context

if (!product) throw new Error('NO_PRODUCT')

const spreadsheetId = '1y9kiSJsXWn_GORlgQ8lD5fHjOmyIhqy2YE8L6lhCutU'

const headerRange = 'Template!A3:EU6'

const { sheetId } = (
  await g_sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [],
    includeGridData: false
  })
).data.sheets.find((s) => s.properties.title === 'Template').properties

const {
  data: { updates }
} = await g_sheets.spreadsheets.values.append({
  spreadsheetId,
  range: `Template!A1`,
  valueInputOption: 'USER_ENTERED',
  insertDataOption: 'INSERT_ROWS',
  requestBody: {
    majorDimension: 'ROWS',
    values: [shopee_beauty_template_row]
    // values: s.matrix.map((row) =>
    //   row.map((v) => (typeof v === 'string' ? v.slice(0, MAX_CONTENT_LIMIT_SINGLE_CELL) : v))
    // )
  }
})

if (!updates || !updates.updatedRange) return

const [sheetName, rowRange] = updates.updatedRange.split('!')
const [start, end] = rowRange.split(':')
const startIndex = parseInt(start.match(/\d+/)[0], 10) - 1

// align, wrap strategy should be applied after appending rows
await g_sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [
      {
        updateDimensionProperties: {
          properties: { pixelSize: 28 },
          range: { dimension: 'ROWS', sheetId, startIndex },
          fields: 'pixelSize'
        }
      },
      {
        repeatCell: {
          range: { sheetId },
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
    ]
  }
})
