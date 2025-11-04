const id = neo.stringify(await prxy['id'])

const reviews = await fetch('https://www.daisomall.co.kr/api/pd/pds/revw/selRevwList', {
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
  referer: `https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=${id}`,
  referrerPolicy: 'strict-origin-when-cross-origin',
  // "body": "{\"pdNo\":\"1049275\",\"pageSize\":10,\"currentPage\":1,\"filter\":\"ALL\",\"sortCond\":\"RCM\"}",
  body: JSON.stringify({
    pdNo: id,
    currentPage: 1,
    pageSize: 20,
    filter: 'ALL',
    sortCond: 'RCM',
    useCommonPaging: false
  }),
  method: 'POST',
  mode: 'cors',
  credentials: 'include'
})
  .then((r) => r.json())
  .then(({ data: { pdRevwList } }) =>
    pdRevwList
      .sort((a, b) => b.rcmCont - a.rcmCont)
      .map(({ revwCn, mbEid, stscVal, revwRgDtm, attrs, ctts, rcmCont }) => ({
        writer: mbEid,
        text: revwCn,
        images: ctts
          .map((ctt) => ctt.imgUrl)
          .filter((v) => /\.(jpg|jpeg|png)$/.test(v))
          .map((urlPath) => `https://cdn.daisomall.co.kr${urlPath}`),
        rating: stscVal,
        date: new Date(revwRgDtm).toISOString(),
        attributes: Object.fromEntries(attrs.map(({ revwIemNm, chocAns }) => [revwIemNm, chocAns])),
        like: rcmCont
      }))
  )

return { reviews: neo.toMatrix(reviews) }
