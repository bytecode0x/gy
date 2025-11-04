if (context.sheets) return

/** @type { import('C:\\Users\\user\\AppData\\Roaming\\gy-test\\plugins\\googleapis') } */
const g = importPlugin('googleapis')

const { g_oauth } = context
if (!g_oauth) throw new Error('NO_G_OAUTH')

const g_sheets = new g.sheets_v4.Sheets({ auth: g_oauth })

Object.assign(context, { g_sheets })
