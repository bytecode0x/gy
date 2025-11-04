export type ProcedureConfig = {
  strict: boolean
  preserveTree: boolean
  invokeEffectImmediately: boolean
  // waitOnEffectResolved: boolean
  priority?: number
  dynamicImportDr?: boolean
  // silenced?: boolean
}
