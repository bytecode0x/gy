import { Edward, Neo } from 'lib/gy/core/instance'
import type { $Action, Action } from 'lib/gy/core/type/action'
import { Matrix } from 'lib/gy/core/type/primitive'
import { DataTree } from 'lib/gy/core/type/tree'
import { Gy } from 'local/desktop/main/gy/init'
import { ActionPreset } from 'local/desktop/main/gy/type/action.preset'
import type winston from 'winston'

declare global {
  const neo: Neo
  const edward: Edward
  const fs: typeof import('fs')
  const stream: typeof import('stream')
  const path: typeof import('path')
  function importPlugin(moduleId: string): any
  function consume<T extends ActionPreset = ActionPreset>({
    $action,
    action
  }: {
    $action?: $Action<T>
    action?: Action<T>
  }): Promise<T['returnType']>
  function log({ msg, tabId }: { msg: any; tabId?: number | string }): Promise<void>
  const initiateProcedure: Gy['initiate']
  const tree: DataTree
  const logger: winston.Logger
  const prevScriptResult: any
  const genie: typeof import('lib/genie')
  const context: Record<string, any>
  function getGdr({ substitute }: { substitute: string }): Matrix
  function setGdr({ substitute, value }: { substitute: string; value: Matrix }): void
  function clipboard(text: string): void
}
