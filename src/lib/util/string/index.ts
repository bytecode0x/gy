import { CSSProperties } from 'react'

export function lowerCaseAndTrim(str: string) {
  return str.toLocaleLowerCase().trim()
}

export function alignDigit(number: number, digit: number) {
  return number.toLocaleString(undefined, { minimumIntegerDigits: digit })
}

export function isMeta(character: string) {
  const meta = ['\\', ':', '|', '']
}

export function filterMeta(str: string) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\n\t\\\:\|\<\>\*\?\"\/\x00-\x1F\x7F]/g, '')
}

// Helper function to convert camelCase to kebab-case
export function kebabize(camelCase: string): string {
  return camelCase.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

export function kebabizeCSSObject(props?: CSSProperties) {
  return props
    ? Object.entries(props)
        .map(([key, value]) => [kebabize(key), value])
        .map((prop) => prop.join(':'))
        .map((prop) => `${prop};`)
        .join('\n')
    : ''
}
