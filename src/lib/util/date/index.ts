export function getDate() {
  const date = new Date()
  return `${date.getFullYear().toString().slice(2)}${alignDigit(date.getMonth() + 1, 2)}${alignDigit(
    date.getDate(),
    2
  )}_${alignDigit(date.getHours(), 2)}${alignDigit(date.getMinutes(), 2)}${alignDigit(date.getSeconds(), 2)}`
}

export function getDateShort({ date = new Date(), splitter = '' }: { date?: Date; splitter?: string }) {
  return `${date.getFullYear().toString().slice(2)}${splitter}${alignDigit(
    date.getMonth() + 1,
    2
  )}${splitter}${alignDigit(date.getDate(), 2)}`
}

export function alignDigit(number: number, digit: number) {
  return number.toLocaleString(undefined, { minimumIntegerDigits: digit })
}
