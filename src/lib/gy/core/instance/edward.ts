import { DataNode } from 'lib/gy/core/class/data-node'
import { DataRecord } from 'lib/gy/core/type/primitive'
import { DataTree } from 'lib/gy/core/type/tree'

function topDownSearch({
  tree,
  key,
  start,
  defaultValue
}: {
  tree: DataTree
  key: string
  start?: DataNode
  defaultValue?: DataRecord[string]
}) {
  if (!key) return defaultValue
  const root = start || tree.nodes.find((dn) => !dn.parent)
  if (!root) throw new Error("can't find the root of the tree")

  const sequence = [root]

  while (sequence.length) {
    const t = sequence.shift() as DataNode

    /**
     * property 'dr' can be undefined if tree is parsed by not class but json
     */
    const dr = t.dr || { ...t.idr, ...t.cdr }

    if (key in dr) {
      // console.log('found node with the key : ', t)
      return dr[key]
    }
    sequence.push(..._getChildren(tree, t))
  }
  // console.log(`can't find node with the key ${key}`)

  return defaultValue
}

function downTopSearch({
  tree,
  key,
  start,
  defaultValue
}: {
  tree: DataTree
  key: string
  start: DataNode
  defaultValue?: DataRecord[string]
}) {
  if (!key) return defaultValue

  const sequence = [start]

  while (sequence.length) {
    const t = sequence.shift() as DataNode

    /**
     * property 'dr' can be undefined if tree is parsed by not class but json
     */
    const dr = t.dr || { ...t.idr, ...t.cdr }

    if (key in dr) return dr[key]

    const parent = _getParent(tree, t)
    if (parent) sequence.push(parent)
  }
  // console.log(`can't find node with the key ${key}`)

  return defaultValue
}

function* trim(tree: DataTree, pivot: string): Generator<[number, DataTree]> {
  if (!pivot) return yield [0, tree]

  const pivotNodes = tree.nodes.filter((dn) => pivot in dn.dr)

  if (!pivotNodes.length) return yield [0, tree]

  for (const [index, dn] of pivotNodes.entries()) {
    yield [index, { id: tree.id, nodes: _getDescendants(tree, dn).reverse().concat(_getAncestors(tree, dn)).reverse() }]
  }
}

function* generateSequence(tree: DataTree): Generator<[number, DataRecord]> {
  for (const [index, leaf] of tree.nodes.filter((dn) => dn.leaf).entries()) {
    const family = _getAncestors(tree, leaf)

    const sequence = new Proxy(
      {},
      {
        get(target, p, receiver) {
          if (typeof p !== 'string') throw new Error('SEQUENCE:INVALID_KEY')

          const dn = family.find((dn) => p in dn.dr)

          if (!dn) return ''

          return dn.dr[p]
        }
      }
    ) as DataRecord

    // const cdr = new Proxy(rawDr, {
    //   get(target, p, receiver) {
    //     if (typeof p !== 'string') throw new Error('CDR:INVALID_KEY')
    //     const substitutions = parseSubstitute(target[p])
    //     return parse(
    //       evaluate({
    //         expression: target[p],
    //         dr: substitutions.reduce((prev, curr) => Object.assign(prev, sequence[curr]), {})
    //       })
    //     )
    //   }
    // }) as unknown

    yield [index, sequence]
  }
}

function getAllSubstitutes(tree: DataTree): Array<string> {
  return tree.nodes.flatMap((n) => Object.keys(n.dr))
}

// excluding the initial node
function _getDescendants(tree: DataTree, node: DataNode): Array<DataNode> {
  if (node.leaf) return []
  const children = tree.nodes.filter((dn) => dn.parent === node.id)
  return children.concat(children.flatMap((cdn) => _getDescendants(tree, cdn)))
}

// including the initial node
function _getAncestors(tree: DataTree, node: DataNode): Array<DataNode> {
  if (!node.parent) return [node]
  return [node].concat(_getAncestors(tree, tree.nodes.find((dn) => dn.id === node.parent)!))
}

// function _preprocessHandle(h: LocalHandle) {
//   return Object.defineProperties(h, {
//     reference: {
//       configurable: false,
//       enumerable: false,
//       writable: false
//     },
//     type: {
//       configurable: false,
//       enumerable: false,
//       writable: false
//     }
//   })
// }

function _getChildren(tree: DataTree, dn: DataNode) {
  if (!tree.nodes.includes(dn)) return []
  return tree.nodes.filter((child) => child.parent === dn.id)
}

function _getParent(tree: DataTree, dn: DataNode) {
  return tree.nodes.find((_) => _.id === dn.parent)
}

export const edward = {
  topDownSearch,
  downTopSearch,
  trim,
  generateSequence,
  getAllSubstitutes
}

export type Edward = typeof edward
