import { app } from 'electron'
import Store from 'electron-store'
import { AppStore } from 'type/app'

export const appStore = new Store<AppStore>({
  name: 'app',
  // setting cwd to appPath will cause an error : file already exists, mkdir
  // even though Its recursive option is set in true
  cwd: app.getPath('userData'),
  defaults: {
    gy: {
      $procedures: [],
      $scripts: [],
      $gdr: {},
      gdr: {},
      gs: {},
      $trees: []
    },
    config: {
      alwaysOntop: false,
      version: app.getVersion(),
      extensionBrowser: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe --profile-directory="Default"',
      workDir: app.getPath('documents'),
      maximumWorkers: 3,
      minimumPageLoadThreshold: 500,
      strict: false,
      preserveTree: true,
      language: 'kr'
    },
    exConfig: {
      offset: { left: '0', right: '0' },
      theme: 'light'
    }
  }
})
