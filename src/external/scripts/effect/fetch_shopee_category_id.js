const keyword = ''

const id = await fetch(
  `https://shopee.com.hk/help/api/v3/global_category/list/?page=1&size=16&keyword=${keyword}&SPC_CDS_VER=2`,
  {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6',
      priority: 'u=1, i',
      'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin'
    },
    referrer: `https://shopee.com.hk/edu/category-guide?keyword=${keyword}`,
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'include'
  }
)
  .then((r) => r.json())
  .then((o) => Object.fromEntries(o.data.global_cats.map((c) => [c.category_name, c.category_id])))
