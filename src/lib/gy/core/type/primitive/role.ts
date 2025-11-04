import { ClientPermission, UserPermission } from './permission'

export type UserRoleSubject = 'admin' | 'viewer' | 'user'

export type ClientRoleSubject = 'admin' | 'basic' | 'premium' | 'expert'

export type RoleConfig<T = UserPermission | ClientPermission> = {
  include?: Array<T>
  exclude?: Array<T>
}

export type UserRole = Record<UserRoleSubject, RoleConfig<UserPermission>>

export type ClientRole = Record<ClientRoleSubject, ClientPermissionSet>

export type ClientPermissionSet = {
  i?: Partial<Record<ClientPermission, Array<string> | boolean>>
  e?: Partial<Record<ClientPermission, Array<string> | boolean>>
}

export type UserPermissionSet = {
  i?: Partial<Record<UserPermission, Array<string> | boolean>>
  e?: Partial<Record<UserPermission, Array<string> | boolean>>
}
