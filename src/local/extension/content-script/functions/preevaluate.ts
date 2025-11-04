import { ProcedureSchema } from 'lib/gy/core/type/procedure'

export function filterUnusedSubstitutes(ps: ProcedureSchema, globalDataRecordKey: Array<string>) {
  // Array of Serialized Task Schema
  const asts = ps.tasks.flat()

  asts.reduce(function (prev, curr, index) {
    return prev
      .filter(
        (substitute) =>
          !curr.actions
            .flatMap(function (as) {
              if (as.value instanceof Array) return as.value.flat()
              if (as.value instanceof Object) Object.values(as.value).flat(2)
              return []
            })
            .includes(substitute)
      )
      .concat(index === asts.length - 1 ? [] : curr.actions.map((as) => `\${${as.name}}`))
  }, globalDataRecordKey)
}

export function filterRequiredSubstitutes(ps: ProcedureSchema) {
  // Array of Serialized Task Schema
  const asts = ps.tasks.flat()

  const asas = asts.flatMap((ts) => ts.actions.map((as) => as.value))
}

// function unwrap(value: Actions['returnType']): Array<string> {
//   if (!value) return []
//   if (value instanceof Array) return value.flat()
//   return Object.values(value).flatMap((decendant) => unwrap(decendant))
// }
