import { app, globalShortcut, Menu, MenuItemConstructorOptions, nativeImage, Tray } from 'electron'
import path from 'path'
import { APP_ALIAS } from 'specifications'
import { getUserWindow, toggleUserWindow } from './user-window'

let tray: Tray

const menu: MenuItemConstructorOptions[] = [
  // {
  //   label: 'Procedure',
  //   id: 'procedure',
  //   submenu: []
  // },
  // {
  //   label: '세션',
  //   id: 'session',
  //   accelerator: 'Alt+Ctrl+P',
  //   acceleratorWorksWhenHidden: true,
  //   click: openSessionDialog
  // },
  {
    label: `Console`,
    id: 'console',
    accelerator: 'Alt+Shift+E',
    click: toggleUserWindow
  },
  { type: 'separator' },
  {
    label: '종료',
    id: 'quit',
    click: app.quit
  }
]

export function initTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'icon.ico')))

  tray.setToolTip(APP_ALIAS)
  tray.on('double-click', function () {
    const window = getUserWindow()
    window.show()
  })

  // globalShortcut.register('Alt+Ctrl+P', openSessionDialog)
  globalShortcut.register('Alt+Shift+E', toggleUserWindow)

  rebuildTrayMenu()
}

export function rebuildTrayMenu() {
  // if (process.env.NODE_ENV !== 'production')
  //   menu.unshift({
  //     label: '캡쳐',
  //     click: async function handleCapture() {
  //       const tape = await openCaptureWindow()

  //       if (!tape) return

  //       // fs.writeFileSync(path.join(app.getPath('documents'), 'tape.txt'), JSON.stringify(tape), 'utf-8')

  //       await new Promise((resolve) => setTimeout(resolve, 2000))

  //       for (const record of tape.value) {
  //         await mouse.consume(record, 'left')

  //         await new Promise((resolve) => setTimeout(resolve, 500))
  //       }
  //     }
  //   })

  const contextMenu = Menu.buildFromTemplate(menu)

  tray.setContextMenu(contextMenu)
}

// export function registerShortcuts() {
//   // set triggers
//   globalShortcut.register('alt+shift+e', toggleUserWindow)
// }

export function getTray() {
  return tray
}

export function getMenu() {
  return menu
}
