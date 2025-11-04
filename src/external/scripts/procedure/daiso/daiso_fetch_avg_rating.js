/** @deprecated */

const id = neo.stringify(await prxy['id'])

const rating = await fetch('https://www.daisomall.co.kr/api/pd/pds/revw/selRevwSmry', {
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6',
    'content-type': 'application/json',
    priority: 'u=1, i',
    'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin'
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  // "body": "{\"pdNo\":\"1062780\"}",
  body: JSON.stringify({ pdNo: id }),
  method: 'POST',
  mode: 'cors',
  credentials: 'include'
})
  .then((r) => r.json())
  .then(
    ({
      data: {
        pdRevw: { revwAvg }
      }
    }) => revwAvg
  )

return { rating: [[rating]] }
