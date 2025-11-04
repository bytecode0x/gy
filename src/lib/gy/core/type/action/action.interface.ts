import { DataRecord } from '../primitive/data'

export type ActionRequirement = 'binding-tab' | 'google-oauth-token'

export type ActionInterface200<
  TemplateLiteral extends string = string,
  SchemaType extends Record<string, any> = Record<string, any>,
  SpecType extends Array<Record<string, any>> = Array<Record<string, any>>,
  ReqType extends Array<ActionRequirement> = Array<ActionRequirement>,
  ReturnType extends DataRecord = DataRecord,
  OptionType = undefined
> = {
  template: TemplateLiteral
  value: SchemaType
  spec: SpecType
  returnType: ReturnType
  req: ReqType
  fallback?: ReturnType[string]
  option: OptionType
}

export type ActionInterface201<
  TemplateLiteral extends string = string,
  SchemaType extends Record<string, any> = Record<string, any>,
  ValueType extends Record<string, any> = Record<string, any>,
  SpecType extends Array<Record<string, any>> = Array<Record<string, any>>,
  ReqType extends Array<ActionRequirement> = Array<ActionRequirement>,
  ReturnType extends DataRecord = DataRecord,
  OptionType = undefined
> = {
  template: TemplateLiteral
  schema: SchemaType
  value: ValueType
  spec: SpecType
  returnType: ReturnType
  req: ReqType
  fallback?: ReturnType[string]
  option: OptionType
}

export type ActionInterface<
  TemplateLiteral extends string = string,
  SchemaType extends Record<string, any> = Record<string, any>,
  ValueType extends Record<string, any> = Record<string, any>,
  SpecType extends Array<Record<string, any>> = Array<Record<string, any>>,
  ReqType extends Array<ActionRequirement> = Array<ActionRequirement>,
  ReturnType extends DataRecord = DataRecord,
  OptionType = undefined
> = ActionInterface201<TemplateLiteral, SchemaType, ValueType, SpecType, ReqType, ReturnType, OptionType>

export type ActionInterfaceSuperset200 = ActionInterface200<
  string,
  Record<string, any>,
  Array<Record<string, any>>,
  Array<ActionRequirement>,
  DataRecord,
  any
>

export type ActionInterfaceSuperset201 = ActionInterface201<
  string,
  Record<string, any>,
  Record<string, any>,
  Array<Record<string, any>>,
  Array<ActionRequirement>,
  DataRecord,
  any
>

export type ActionInterfaceSuperset = ActionInterfaceSuperset201
