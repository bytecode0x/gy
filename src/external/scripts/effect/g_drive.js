if (context.g_drive) return

/** @type { import('C:\\Users\\user\\AppData\\Roaming\\gy-test\\plugins\\googleapis') } */
const g = importPlugin('googleapis')

const { g_oauth } = context
if (!g_oauth) throw new Error('NO_G_OAUTH')

const g_drive = new g.drive_v3.Drive({ auth: g_oauth })

Object.assign(context, { g_drive })
