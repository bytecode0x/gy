// this is dummy no necessary for now
export type UserPermission = 'ADD_CLIENT' | 'REMOVE_CLIENT' | 'COMMAND_CLIENT'

export type ClientPermission =
  | ProcedurePermission
  | TreePermission
  | EffectPermission
  | TriggerPermission
  | GenenralPermission

export type ProcedurePermission =
  | 'POST_PROCEDURE'
  | 'FETCH_PROCEDURE'
  | 'DEFINE_PROCEDURE'
  | 'REMOVE_PROCEDURE'
  | 'CREATE_SHARED_PROCESS_SESSION'
  | 'PARTICIPATE_SHARED_PROCESS_SESSION'
  | 'FETCH_GLOBAL_PROCEDURE'
  | 'READ_GLOBAL_PROCEDURE'
  | 'WRITE_GLOBAL_PROCEDURE'

export type TreePermission = 'PRESERVE_TREE' | 'FETCH_TREE' | 'REMOVE_TREE' | 'SET_TREE_NAME' | 'MERGE_TREE'

export type EffectPermission =
  | 'POST_SCRIPT'
  | 'FETCH_SCRIPT'
  | 'INVOKE_MANUALLY'
  | 'DEFINE_SCRIPT'
  | 'FETCH_GLOBAL_SCRIPT'
  | 'READ_GLOBAL_SCRIPT'
  | 'WRITE_GLOBAL_SCRIPT'
  | 'REMOVE_SCRIPT'

export type TriggerPermission = 'DEFINE_TRIGGER'

export type GenenralPermission = 'NO_ADVERTISE' | 'UPDATE_CLIENT'

export type Permission = UserPermission | ClientPermission
