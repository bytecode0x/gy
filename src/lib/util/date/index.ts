export function getDate() {
  const date = new Date()
  return `${date.getFullYear().toString().slice(2)}${alignDigit(date.getMonth() + 1, 2)}${alignDigit(
    date.getDate(),
    2
  )}_${alignDigit(date.getHours(), 2)}${alignDigit(date.getMinutes(), 2)}${alignDigit(date.getSeconds(), 2)}`
}

export function getDateShort() {
  const date = new Date()
  return `${date.getFullYear().toString().slice(2)}${alignDigit(date.getMonth() + 1, 2)}${alignDigit(
    date.getDate(),
    2
  )}`
}

export function alignDigit(number: number, digit: number) {
  return number.toLocaleString(undefined, { minimumIntegerDigits: digit })
}
