/**
 * methods on matrix should only deal with the value part of the template string pairing with JSON
 */

import { NoSubstituteInDr } from 'lib/gy/core/error'
import { pMatrixSubstitution, pSerializedSubstitution, pSubstitution } from 'lib/gy/core/literal/regexp'
import { matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { DataRecord, Matrix } from 'lib/gy/core/type/primitive'

function stringify(
  data: any,
  {
    columnSeparator = ',',
    joinWithEscaped = false,
    rowSeparator = '\n'
  }: {
    joinWithEscaped?: boolean | null
    columnSeparator?: string
    rowSeparator?: string
  } = {}
) {
  if (!data) return ''
  // return value instanceof Array ? value.join(separator) : typeof value === 'string' ? value : JSON.stringify(value)
  if (typeof data === 'string') return data

  // const columnSeparatorReg = /(?<!\\),/g
  const columnSeparatorReg = new RegExp(`(?<!\\\\)${columnSeparator}`, 'g')
  // const rowSeparatorReg = /(?<!\\)\n/g
  const rowSeparatorReg = new RegExp(`(?<!\\\\)${rowSeparator}`, 'g')

  // const escapedColumnSeparatorReg = /\\,/g
  const escapedColumnSeparatorReg = new RegExp(`\\\\${columnSeparator}`, 'g')
  // const escapedRowSeparatorReg = /\\\n/g
  const escapedRowSeparatorReg = new RegExp(`\\\\${rowSeparator}`, 'g')

  if (!matrixSchema.safeParse(data).success)
    return joinWithEscaped
      ? JSON.stringify(data).replace(escapedColumnSeparatorReg, ',').replace(escapedRowSeparatorReg, '\n')
      : JSON.stringify(data)
          .replace(columnSeparatorReg, String.raw`\,`)
          .replace(rowSeparatorReg, String.raw`\n`)

  switch (joinWithEscaped) {
    case true: {
      return (data as Array<Array<string>>)
        .map((row) =>
          (row as Array<string>)
            .map((v) => v.replace(escapedColumnSeparatorReg, ',').replace(escapedRowSeparatorReg, '\n'))
            .join(String.raw`\,`)
        )
        .join(String.raw`\n`)
    }

    case false: {
      return (data as Array<Array<string>>)
        .map((row) =>
          (row as Array<string>)
            .map((v) => v.replace(columnSeparatorReg, String.raw`\,`).replace(rowSeparatorReg, String.raw`\n`))
            .join(',')
        )
        .join('\n')
    }

    default: {
      return (data as Array<Array<string>>).map((row) => (row as Array<string>).join(',')).join('\n')
    }
  }
}

function parse(
  raw: string | number,
  {
    columnSeparator = ',',
    rowSeparator = '\n',
    splitWithEscaped
  }: {
    splitWithEscaped?: boolean
    columnSeparator?: string
    rowSeparator?: string
  } = {}
): Matrix {
  if (typeof raw === 'number') return [[raw.toString()]]
  if (!raw || !(typeof raw === 'string' && raw.trim())) return [[]]
  // const columnSeparatorReg = /(?<!\\),/g
  const columnSeparatorReg = new RegExp(`(?<!\\\\)${columnSeparator}`, 'g')
  // const rowSeparatorReg = /(?<!\\)\n/g
  const rowSeparatorReg = new RegExp(`(?<!\\\\)${rowSeparator}`, 'g')

  /**
   * seems like look behind assertion is not implemented yet in JS
   */

  // const escapedColumnSeparatorReg = /\\,/g
  const escapedColumnSeparatorReg = new RegExp(`\\\\${columnSeparator}`, 'g')
  // const escapedRowSeparatorReg = /\\\n/g
  const escapedRowSeparatorReg = new RegExp(`\\\\${rowSeparator}`, 'g')

  return splitWithEscaped
    ? raw
        .split(escapedRowSeparatorReg)
        .map((row) =>
          row
            .split(escapedColumnSeparatorReg)
            .map((v) => v.replace(columnSeparatorReg, String.raw`\,`).replace(rowSeparatorReg, String.raw`\n`))
        )
    : raw.split(rowSeparatorReg).map((row) =>
        /**
         * if you put reg exp in search value, somehow It doesn't work
         * maybe It has something to do with global flag or search index stuff idk what exactly
         */
        row
          .split(columnSeparatorReg)
          .map((v) => v.replace(escapedColumnSeparatorReg, ',').replace(escapedRowSeparatorReg, '\n'))
      )
}

function transpose(data: Array<Array<string>>) {
  const transposed: Array<Array<string>> = []
  data.forEach(function (row, row_index) {
    row.forEach(function (v, col_index) {
      if (!transposed[col_index]) transposed[col_index] = []
      transposed[col_index][row_index] = v
    })
  })

  return transposed
}

function toMatrix(value: any): Array<Array<string>> {
  if (!value) return [[]]
  /**
   * no need to check type
   * It would invoke an error on the entries function if the type doesn't match
   */

  // if (typeof value === 'number') return [[`$<json|parse|\${${value}}>`]]

  // if (typeof value === 'string') return [[value]]

  return Object.entries(value).map(function ([k, v]) {
    if (v === null || v === undefined || typeof v === 'function' || typeof v === 'symbol' || typeof v === 'bigint')
      return [k, 'null']
    if (typeof v !== 'object') return [k, JSON.stringify(v)]
    return [k, JSON.stringify(toMatrix(v))]
  })
}

function fromMatrix(matrix: Array<Array<string>>) {
  if (!matrixSchema.safeParse(matrix).success) return matrix
  /**
   * no need to check type
   * It would invoke an error on the fromEntries function if the type doesn't match
   */

  const obj = Object.fromEntries(matrix)
  matrix.forEach(function ([k, v]) {
    let value

    try {
      value = JSON.parse(v)
      obj[k] =
        typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' ? value : fromMatrix(value)
    } catch (err) {
      obj[k] = v
    }
  })

  const keys = Object.keys(obj)

  if (keys.every((k) => /^\d+$/.test(k))) {
    const array: Array<any> = []

    keys.forEach(function (k) {
      // @ts-ignore
      array[k] = obj[k]
    })

    return array
  }

  return obj
}

function extractSubstitutes(expression: string) {
  const pSubstitution =
    /(?<!\\)\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]+|\d+))\])*(?:\((?<separators>.+)\))*(?:\/(?<flags>[i]+))?(?<!\\)\}/g

  const substitutions: Array<string> = []

  let result = pSubstitution.exec(expression)

  while (result) {
    if (result?.groups?.substitute) substitutions.push(result.groups.substitute)
    result = pSubstitution.exec(expression)
  }

  return substitutions
}

function evaluate(matrix: Matrix, { edr = {} }: { edr?: DataRecord }): Matrix {
  return matrix.map((row) => row.map((symbol) => substitute(symbol, { edr })))
}

function interpret(
  raw: string,
  {
    edr,
    columnSeparator,
    rowSeparator,
    splitWithEscaped
  }: { edr?: DataRecord; splitWithEscaped?: boolean; columnSeparator?: string; rowSeparator?: string } = {}
): Matrix {
  const substituted = substitute(raw, { edr })

  return parse(substituted, { columnSeparator, rowSeparator, splitWithEscaped })
}

function serialize(value: string | Matrix, { edr }: { edr?: DataRecord } = {}) {
  if (typeof value !== 'string') return stringify(value)

  return substitute(value, { edr })
}

function substitute(expression: string, { edr = {} }: { edr?: DataRecord }): string {
  if (!pSubstitution.test(expression)) return expression

  return substitute(
    expression.replace(pSubstitution, (match, key, index, separators, flags) => {
      // return original expression for later substitution
      // if (!(substitute in edr)) throw new NoSubstituteInDr(`${substitute} does not exist in dr`)
      if (!(key in edr)) return ''

      const jointers: Array<string> = []
      if (separators) {
        const regex = /\((.+)\)/g

        let result = regex.exec(match)
        while (result !== null) {
          jointers.push(result[1])
          result = regex.exec(match)
        }
      }

      if (index) {
        const indexes: Array<string> = []
        const regex = /\[([\w\d]+)\]/g

        let result = regex.exec(match)
        while (result !== null) {
          indexes.push(result[1])
          result = regex.exec(match)
        }

        const evaluated = indexes.reduce(
          (prev, curr) => {
            const evaluatedIndex = substitute(curr, { edr })
            // @ts-ignore
            const next = prev[/^\d+$/.test(evaluatedIndex) ? parseInt(evaluatedIndex, 10) : evaluatedIndex]
            if (!next) throw new Error(`INVALID_SUBSTITUTE:${curr}=>${evaluatedIndex}`)
            return next
          },
          (flags as string)?.includes('t') ? transpose(edr[key]) : edr[key]
        ) as any

        return stringify(evaluated, { joinWithEscaped: !!flags && (flags as string).includes('i') })
      }

      /**
       * todo : user should decide which character should be used as separator
       * and if user want to use the separator as an character, user need to escpae it with backslash
       */
      return stringify((flags as string)?.includes('t') ? transpose(edr[key]) : edr[key], {
        joinWithEscaped: !!flags && (flags as string)?.includes('i')
      })
    }),
    { edr }
  )
}

/**
 * this function should be used on an element of Matrix instead of whole raw string
 */
function _substitute(expression: string, { dr = {} }: { dr?: DataRecord }): string {
  // const pSubstitution =
  //   /(?<!\\)\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]+|\d+))\])*(?:\((?<separators>.+)\))*(?:\/(?<flags>[itp]+))?(?<!\\)\}/

  // const pMatrixSubstitution =
  //   /^\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]+|\d+))\])*(?:\((?<separators>.+)\))*(?:\/(?<flags>[itp]+))?(?<!\\)\}$/

  // const pSerializedSubstitution =
  //   /"\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]+|\d+))\])*(?:\((?<separators>.+)\))*(?:\/(?<flags>[itp]+))?(?<!\\)\}"/

  if (
    !pSubstitution.test(expression) ||
    (!pMatrixSubstitution.test(expression) && !pSerializedSubstitution.test(expression))
  )
    return expression

  if (pMatrixSubstitution.test(expression))
    return _substitute(
      expression.replace(pMatrixSubstitution, (match, substitute, index, separators, flags) => {
        // return original expression for later substitution
        if (!(substitute in dr)) throw new NoSubstituteInDr(`${substitute} does not exist in dr`)

        const jointers: Array<string> = []
        if (separators) {
          const regex = /\((.+)\)/g

          let result = regex.exec(match)
          while (result !== null) {
            jointers.push(result[1])
            result = regex.exec(match)
          }
        }

        if (index) {
          const indexes: Array<string> = []
          const regex = /\[([\w\d]+)\]/g

          let result = regex.exec(match)
          while (result !== null) {
            indexes.push(result[1])
            result = regex.exec(match)
          }

          const evaluated = indexes.reduce(
            (prev, curr) => {
              const evaluatedIndex = _substitute(curr, { dr })
              // @ts-ignore
              const next = prev[/^\d+$/.test(evaluatedIndex) ? parseInt(evaluatedIndex, 10) : evaluatedIndex]
              if (!next) throw new Error(`INVALID_SUBSTITUTE:${curr}=>${evaluatedIndex}`)
              return next
            },
            (flags as string)?.includes('t') ? transpose(dr[substitute]) : dr[substitute]
          ) as any

          return stringify(evaluated, { joinWithEscaped: !!flags && (flags as string).includes('i') })
        }

        /**
         * todo : user should decide which character should be used as separator
         * and if user want to use the separator as an character, user need to escpae it with backslash
         */
        return stringify((flags as string)?.includes('t') ? transpose(dr[substitute]) : dr[substitute], {
          joinWithEscaped: !!flags && (flags as string)?.includes('i')
        })
      }),
      { dr }
    )

  return _substitute(
    expression.replace(new RegExp(pSerializedSubstitution, 'g'), (match, substitute, index, separators, flags) => {
      /**
       * match : whole string
       * p1 : substitute name
       * p2 : index or key if any memeber referencing exists
       * p3 : separator
       *
       * TODO : implement spacing characters; \t, \n, etc,
       * change \w+ into non meta-characters set
       */
      if (!(substitute in dr)) throw new NoSubstituteInDr()

      const jointers: Array<string> = []

      if (index) {
        const regex = /\((.+)\)/g

        let result = regex.exec(match)
        while (result !== null) {
          jointers.push(result[1])
          result = regex.exec(match)
        }
      }

      if (substitute) {
        const indexes: Array<string> = []
        const regex = /\[([\w\d]+)\]/g

        let result = regex.exec(match)
        while (result !== null) {
          indexes.push(result[1])
          result = regex.exec(match)
        }

        const evaluated = indexes.reduce(
          (prev, curr) => {
            const evaluatedIndex = _substitute(curr, { dr })
            // @ts-ignore
            const next = prev[/^\d+$/.test(evaluatedIndex) ? parseInt(evaluatedIndex, 10) : evaluatedIndex]
            if (!next) throw new Error(`INVALID_SUBSTITUTE:${curr}=>${evaluatedIndex}`)
            return next
          },
          (flags as string)?.includes('t') ? transpose(dr[substitute]) : dr[substitute]
        ) as any

        return stringify(evaluated, { joinWithEscaped: !!flags && (flags as string).includes('i') })
      }

      /**
       * todo : user should decide which character should be used as separator
       * and if user want to use the separator as an character, user need to escpae it with backslash
       */
      return stringify((flags as string)?.includes('t') ? transpose(dr[substitute]) : dr[substitute], {
        joinWithEscaped: !!flags && (flags as string)?.includes('i')
      })
    }),
    { dr }
  )
}

export const neo = {
  stringify,
  parse,
  fromMatrix,
  toMatrix,
  extractSubstitutes,
  transpose,
  substitute,
  interpret,
  serialize
}

export type Neo = typeof neo
