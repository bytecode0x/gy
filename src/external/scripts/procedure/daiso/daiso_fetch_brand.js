const id = neo.stringify(await prxy['id'])

const { brnd, vsipPdDtl } = await fetch('https://www.daisomall.co.kr/api/pd/pdr/pdDtl/selPdDtlDesc', {
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'content-type': 'application/json',
    priority: 'u=1, i',
    'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin'
  },
  referrer: `https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=${id}`,
  body: `{\"pdNo\":\"${id}\"}`,
  method: 'POST',
  mode: 'cors',
  credentials: 'include'
})
  .then((r) => r.json())
  .then(({ data: { pdDtlDesc } }) => pdDtlDesc)

const brand = [[brnd?.brndNm || '']]

const brand_en = [[brnd?.enBrndNm || '']]

const descriptions = [[vsipPdDtl || '']]

return { brand, brand_en, descriptions }
