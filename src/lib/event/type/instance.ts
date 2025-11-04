export type Instance<TComponentUnion extends string = string, TAliasUnion extends string = string> =
  | {
      component: TComponentUnion
      id: string | number
    }
  | { component: TComponentUnion; alias: TAliasUnion }

export type InstanceMatrix<TComponentUnion extends string = string, TAliasUnion extends string = string> = {
  [TComponent in TComponentUnion]:
    | {
        component: TComponent
        id: string | number
      }
    | { component: TComponent; alias: TAliasUnion }
}[TComponentUnion]
