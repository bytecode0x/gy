const gdr = await getGdr()
/** @type { Record<string, { criteria: any; spreadsheetId: string | null | undefined; }> } */
const context = neo.fromMatrix(gdr['spreadsheets_context']) || {}
const criterion = getDateShort()
const name = neo.stringify(topDownSearch({ tree, key: 'cafe_name' }))
const url = neo.stringify(topDownSearch({ tree, key: 'cafe_url' }))

/** @type { SheetData } */
const data = {
  title: `${getDateShort()}_${name}`,
  sheets: [],
  spreadsheetId: context[url] && context[url].criteria === criterion ? context[url].spreadsheetId : undefined
}

for (const [i, branch] of trim(tree, 'board_name')) {
  console.log(`${i}th branch: `, branch)
  const boardName = neo.stringify(topDownSearch({ tree: branch, key: 'board_name' }))
  const boardId = neo.stringify(topDownSearch({ tree: branch, key: 'board_id' }))

  // /** @type { Array<{ date:number; writer: string; title: string; postUrl: string; textContent:string; images: Array<string>; comments: Array<{ writer: string; content: string; date: number }> }> } */
  /** @type { Array<{ id:number; writer: string; title: string; textContent: string; postUrl: string; images: Array<string>; date: number; comments: Array<{ writer: string; date: number; content: string; }>  }> } */
  const posts = []

  for (const [k, sequence] of generateSequence(branch)) {
    /** @type { Array<{ id:number; writer: string; title: string; textContent: string; postUrl: string; images: Array<string>; date: number; comments: Array<{ writer: string; date: number; content: string; }>  }> } */
    const partial = neo.fromMatrix(sequence['posts'])

    console.log(`partial${k}: `, partial)

    partial.forEach(function (p) {
      if (posts.every((post) => post.id !== p.id)) posts.push(p)
    })
  }

  data.sheets.push({
    title: boardName,
    id: boardId,
    headers: [['글 번호', '작성자', '제목', '텍스트', '이미지', '댓글', 'URL', '날짜']],
    matrix: posts.map((p) => [
      p.id,
      p.writer,
      p.title,
      p.textContent,
      p.images.join('\n'),
      p.comments.map((c) => `${c.writer}\t${new Date(c.date).toISOString()}\n${c.content}`).join('\n\n'),
      p.postUrl,
      new Date(p.date).toISOString()
    ])
  })
}

Object.assign(context, { sheetData: data })

// setStorageItem({ key: 'sheetData', value: data })

expect('spreadsheetId').then(function (spreadsheetId) {
  context[url] = { spreadsheetId, criteria: criterion }
  console.log('spreadsheet context record resolved: ', context, '\nurl: ', url)
  return setGdr({ key: 'spreadsheets_context', matrix: neo.toMatrix(context) })
})