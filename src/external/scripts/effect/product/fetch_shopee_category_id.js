const { category_keyword } = await consume({
  $action: {
    template: 'DEFINE',
    id: '',
    name: 'category_keyword',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Define['value'] } */
    value: {
      title: 'input category keyword',
      confirm: '$<json|parse|true>',
      record: { category_keyword: '' }
    }
  }
})

if (!category_keyword) throw new Error('NO_CATEGORY_KEYWORD')

await log({ msg: { category_keyword } })

const { load_shopee_hk$renderer_id } = await consume({
  action: {
    template: 'LOAD_URL',
    id: '',
    name: 'load_shopee_hk',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__LoadUrl['value'] } */
    value: {
      find: 'https://shopee.com.hk/*',
      active: true,
      url: 'https://shopee.com.hk'
    }
  }
})

const code = `
console.log('running category script') 

const SPC_CDS = (await cookieStore.get('SPC_CDS'))?.value

const keyword = '${category_keyword}'

const encoded = new URLSearchParams({ keyword }).toString().slice(2)

if(!SPC_CDS) throw new Error("NOT_AUTHENTICATED")

return fetch(\`https://shopee.com.hk/help/api/v3/global_category/list/?page=1&size=16&keyword=\${encoded}&SPC_CDS=\${SPC_CDS}&SPC_CDS_VER=2\`, {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "priority": "u=1, i",
    "sec-ch-ua": "\\"Chromium\\";v=\\"140\\", \\"Not=A?Brand\\";v=\\"24\\", \\"Google Chrome\\";v=\\"140\\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\\"Windows\\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  },
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
}).then((r) => r.json()).then(({ data: { global_cats } }) => Object.fromEntries(global_cats.map((c) => [c.path.map( (sub) => sub.category_name ).join('>'), c.category_id])));
`

const { shopee_category } = await consume({
  action: {
    template: 'EVAL_BINDING_TAB',
    id: '',
    name: 'shopee_category',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EvalBindingTab['value'] } */
    value: {
      rendererId: parseInt(neo.stringify(load_shopee_hk$renderer_id), 10),
      code
    }
  }
})

/** @type { Record<string, number> } */
const category = neo.fromMatrix(shopee_category)

/**
 * need to select among ids
 * the problem is you may need to search again
 *
 * => using while statement seems bad
 */

const { category_id } = await consume({
  action: {
    template: 'SELECT',
    id: '',
    name: 'category_id',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Select['value'] } */
    value: {
      singular: true,
      options: Object.values(category).map((v) => [v]),
      labels: Object.keys(category).map((v) => [v])
    }
  }
})

Object.assign(context, { category_id })
