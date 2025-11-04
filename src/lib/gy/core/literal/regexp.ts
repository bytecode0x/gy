export const pInterpretation =
  // /^(?<!\\)\$<(?<interpreter>(?:matrix|json|function|none))\|(?<mode>(?:parse|serialize))\|(?<value>[^(?<!\\)\|]*)(?:\|(?<option>[^(?<!\\)\|]*))?(?:\|(?<flag>[^(?<!\\)\|]*))?(?<!\\)>$/
  // /^(?<!\\)\$<(?<interpreter>(?:matrix|json|function|none))\|(?<mode>(?:parse|serialize))\|(?<value>[^(?<=\\)\|]*)(?:\|(?<option>[^(?<=\\)\|]*))?(?:\|(?<flag>[^(?<=\\)\|]*))?(?<!\\)>$/
  // /^(?<!\\)\$<(?<interpreter>(?:matrix|json|function|none))\|(?<mode>(?:parse|serialize))\|(?<value>(?:[^\\|]|\\\|)*)?(?:\|(?<option>(?:[^\\|]|\\\|)*))?(?:\|(?<flag>(?:[^\\|]|\\\|)*))?>$/
  // /^(?<!\\)\$<(?<interpreter>(?:matrix|json|function|none))\|(?<mode>(?:parse|serialize))\|(?<value>(?:[^\\|]|\\\|)*)?(?:\|(?<option>(?:[^\\|]|\\\|)*))?(?:\|(?<flag>(?:[^\\|]|\\\|)*))?>$/
  /**
   * /[\s\S]/ and /./ are different each other
   * . (dot character) can't match newline(\n) or carriage return(\r)
   */
  /^(?<!\\)\$<(?<interpreter>(?:matrix|json|function|none))\|(?<mode>(?:parse|serialize))\|(?<value>[\s\S]*)?(?:\|(?<option>.*))?(?:\|(?<flag>.*))?(?<!\\)>$/

export const pSubstitution =
  /(?<!\\)\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*|\d+))\])*(?:\((?<separators>.+)\))*(?:\/(?<flags>[i]+))?(?<!\\)\}/

export const pMatrixSubstitution =
  /^\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*|\d+))\])*(?:\((?<separators>.+)\))*(?:\/(?<flags>[i]+))?(?<!\\)\}$/

export const pSerializedSubstitution =
  /"\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*|\d+))\])*(?:\((?<separators>.+)\))*(?:\/(?<flags>[i]+))?(?<!\\)\}"/
