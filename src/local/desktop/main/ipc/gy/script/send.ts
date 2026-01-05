import { FetchScript, FetchScriptDescriptors, PostScript, PostScriptDescriptor } from 'lib/event/sementic'
import { Script, ScriptDescriptor } from 'lib/gy/core/type/script'
import { getEvHandler } from 'local/desktop/main/infra/event/event-handler'

export function postScript({ script }: { script: Script }) {
  const evHandler = getEvHandler()

  return evHandler.sendEvent<PostScript>({
    name: 'POST_SCRIPT',
    payload: { script },
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function postScriptDescriptor({ descriptor }: { descriptor: ScriptDescriptor }) {
  const evHandler = getEvHandler()

  return evHandler.sendEvent<PostScriptDescriptor>({
    name: 'POST_SCRIPT_DESCRIPTOR',
    payload: { descriptor },
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function fetchScript({ sid }: { sid: string }) {
  const evHandler = getEvHandler()
  return evHandler.sendEvent<FetchScript>({
    name: 'FETCH_SCRIPT',
    payload: { sid },
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function fetchScriptRecords() {
  const evHandler = getEvHandler()
  return evHandler.sendEvent<FetchScriptDescriptors>({
    name: 'FETCH_SCRIPTS_DESCRIPTORS',
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function parseMeta(comments: string) {
  const p = /(?<entry>@(required|optional)\s*:\s*\[(\w[\w\d]*\s*,?\s*)*\])/g

  let entry = p.exec(comments)?.groups?.entry?.split(':')

  const meta: Record<string, Array<string>> = {}

  if (!entry) return meta

  while (entry) {
    const key = entry[0].trim().slice(1)
    const value = entry[1]
      .trim()
      .slice(1, -1)
      .split(',')
      .map((v) => v.trim())
    meta[key] = value
    entry = p.exec(comments)?.groups?.entry?.split(':')
  }

  return meta
}
