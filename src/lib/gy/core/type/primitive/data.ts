export type RawString = string

export type Matrix = Array<Array<string>>

export type DataRecord = Record<string, Matrix>

export type DynamicDataRecord = Record<string, Promise<Array<Array<string>>>>

export type RawDataRecord = Record<string, string>

// export type Parser = 'json' | 'matrix' | 'function' | 'none'

// export type Serializer = 'json' | 'matrix'
