export type TriggerInterface<
  TemplateType extends string = string,
  ValueType extends Record<string, any> = Record<string, any>,
  SpecType extends Record<string, any> = Record<string, string>,
  ReturnType extends any = void
> = {
  template: TemplateType
  value: ValueType
  spec: SpecType
  returnType: ReturnType
  fallback?: ReturnType
}

export type TriggerInterfaceSuperset = TriggerInterface<string, Record<string, any>, Record<string, any>, any>
