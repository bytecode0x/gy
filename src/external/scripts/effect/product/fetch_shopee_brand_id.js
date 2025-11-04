const { category_id, brand_name } = context

if (!category_id || !brand_name) throw new Error('NO_CONTEXT')

const { load_seller_shopee$renderer_id } = await consume({
  action: {
    template: 'LOAD_URL',
    id: '',
    name: 'load_seller_shopee',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__LoadUrl['value'] } */
    value: {
      find: 'https://seller.shopee.kr/*',
      url: 'https://seller.shopee.kr/'
    }
  }
})

const code = `
console.log('running brand script') 

const SPC_CDS = (await cookieStore.get('SPC_CDS'))?.value

const category_id = '${category_id}'

const brand_name = '${brand_name}'

if(!SPC_CDS) throw new Error("NOT_AUTHENTICATED")

return fetch(\`https://seller.shopee.kr/api/v3/mtsku/get_mtsku_brand_list?SPC_CDS=\${SPC_CDS}&SPC_CDS_VER=2&category_ids=\${category_id}&brand_status=1&limit=50&brand_name=\${brand_name}&cnsc_shop_id=1545069591&cbsc_shop_region=sg\`, {
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
}).then((r) => r.json()).then(({ data: { list: [{ brand_list }] } }) => brand_list)
`

const { shopee_brand } = await consume({
  action: {
    template: 'EVAL_BINDING_TAB',
    id: '',
    name: 'shopee_brand_id',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EvalBindingTab['value'] } */
    value: {
      rendererId: parseInt(neo.stringify(load_seller_shopee$renderer_id), 10),
      code
    }
  }
})

/** @type { Array<{ name: string; brand_id: string; display_name: string; }> } */
const brand = neo.fromMatrix(shopee_brand)

const { brand_id } = await consume({
  action: {
    template: 'SELECT',
    id: '',
    name: 'category_id',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Select['value'] } */
    value: {
      singular: true,
      options: brand.map((b) => [b.brand_id]),
      labels: brand.map((b) => [b.name])
    }
  }
})

Object.assign(context, { brand_id })
