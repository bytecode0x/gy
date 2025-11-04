export function getRandomColor() {
  return `#${Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
}
