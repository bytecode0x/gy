export type ScriptRecord200 = {
  name: string
  sid: string
  hash: string
  size: number
  /**
   * environment check would be better done within script if needed
   */
  // env: 'node' | 'js'
}
