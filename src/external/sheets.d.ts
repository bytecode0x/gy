declare type SheetData = {
  spreadsheetId: string
  title: string
  sheets: Array<{
    id: number
    title: string
    headers: Array<Array<string>>
    // matrix: Array<Array<string>> | Array<Record<string, string>>
    matrix: Array<Array<string>>
  }>
}
