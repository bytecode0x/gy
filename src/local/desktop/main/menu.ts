import { Menu } from 'electron'

export function setMenu() {
  const isMac = process.platform === 'darwin'

  const devTemplate: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
    {
      label: 'File',
      // submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
      submenu: [{ role: 'close' }]
    },
    {
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }]
    }
  ]

  const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = []

  const menu = Menu.buildFromTemplate(process.env.NODE_ENV === 'development' ? devTemplate : devTemplate)
  // const menu = Menu.buildFromTemplate([])

  Menu.setApplicationMenu(menu)
}
