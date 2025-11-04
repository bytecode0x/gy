export type Data<T extends Record<string, Array<any>> = Record<any, Array<string>>> = Array<T>

export interface Program {
  id: string
  // proc : ProecdureRecord
  public: boolean
  participants: Array<string>
  host: string
  data: Data
}
