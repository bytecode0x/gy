import { neo } from 'lib/gy/core/instance/neo'

export function serialize({
  value,
  serializer,
  options = {}
}: {
  value: any
  serializer: 'matrix' | 'json'
  options?: any
}): string {
  switch (serializer) {
    case 'matrix': {
      return `$<matrix|parse|${neo.stringify(value, options)}>`
    }

    case 'json': {
      return `$<json|parse|${JSON.stringify(value, options.replacer, options.space)}>`
    }

    default: {
      throw new Error(`invalid serializer: ${serializer}`)
    }
  }
}
