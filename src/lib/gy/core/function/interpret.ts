import fs from 'fs'
import { runScript } from 'lib/gy/core/function'
import path from 'path'
import { edward, neo } from '../instance'
import { pInterpretation } from '../literal/regexp'

export async function interpret(raw: string, header: Record<string, any> = {}): Promise<any> {
  const substituted = neo.substitute(raw, { edr: header.edr })

  const result = pInterpretation.exec(substituted)

  if (!result) return substituted

  const { interpreter, mode, value, option, flag } = result.groups!

  // logger.info('interpret', { interpreter, mode, value, raw, substituted })

  /**
   * !!!!!!!!! IMPORTANT !!!!!!!!!
   * when you interpret in parse mode, your substitutes are taken as string
   * when you interpret in serialize mode, your substitutes are taken as matrix
   */
  switch (interpreter) {
    case 'matrix': {
      if (mode === 'parse') return neo.parse(await interpret(value, header), header)

      return neo.serialize(await interpret(value, header), header)
    }
    case 'json': {
      // const { reviver } = interpretedOptions
      /**
       * doesn't need to spread the header as It requires a function
       */
      if (mode === 'parse') return JSON.parse(await interpret(value, header))
      return JSON.stringify(await interpret(value, header), header.replacer, header.space)
    }
    case 'function': {
      return runScript({ code: await interpret(value, header), params: { fs, path, dr: header.dr, neo, edward } })
    }
    case 'none': {
      return interpret(value, header)
    }
    default:
      throw new Error(`invalid parser\nparsing ${JSON.stringify(value)}`)
  }
}
