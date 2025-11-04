for (const [_, branch] of edward.trim(tree, '')) {
  for (const [_, sequence] of edward.generateSequence(branch)) {
    const keys = edward.getAllSubstitutes(tree)

    const msg = Object.fromEntries(keys.map((k) => [k, sequence[k]]))
    await log({ msg })
    await log({ msg, tabId: parseInt(neo.stringify(sequence['ext']), 10) })
  }
}
