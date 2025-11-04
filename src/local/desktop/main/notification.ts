import assert from 'assert'
import { Notification } from 'electron'

export const notification: { current: Notification | null } = { current: null }

export function initNotification() {
  notification.current = new Notification({
    timeoutType: 'default'
  })
}

export function notify(options: Electron.NotificationConstructorOptions | undefined) {
  assert.ok(notification.current)
  Object.assign(notification.current, options)
  notification.current.show()
}
