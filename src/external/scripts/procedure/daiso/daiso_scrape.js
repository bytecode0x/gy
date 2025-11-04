const id = [[/pdNo=(?<id>\d+)/.exec(window.location.href).groups.id]]

const name = [[document.querySelector('div.tit').lastChild.textContent.trim()]]

const price = [
  [
    Array.from(document.querySelector('div.goods-price').textContent.trim())
      .filter((v) => /\d/.test(v))
      .join('')
  ]
]

const price_unit = [['won']]

const p = new RegExp('resize/(.+)/optimize')

const main_images = Array.from(document.querySelectorAll('div.goods-swiper-thums picture > img')).map((s) => [
  s.getAttribute('src').replace(p, 'resize/600/optimize')
])

const descriptive_images = [[document.querySelector('div.editor-area img').src]]

const descriptions = [[document.querySelector('div.editor-area img').alt]]

const scraped_at = [[new Date().toISOString()]]

const category = Array.from(document.querySelectorAll('div.el-breadcrumb > span.el-breadcrumb__item')).map((item) => [
  item.textContent.trim()
])

const url = [[location.href]]

const platform = [['daiso']]

const attributes = neo.toMatrix(
  Object.fromEntries(
    Array.from(document.querySelectorAll('div.rating-score')).map((c) => [
      c.querySelector('div.tit').textContent.trim(),
      c.querySelector('div.name').textContent.trim()
    ])
  )
)

const rating = [[document.querySelector('span.rate-txt').textContent.trim()]]

// const brand = [['daiso']]

return {
  id,
  name,
  price,
  price_unit,
  main_images,
  descriptive_images,
  descriptions,
  scraped_at,
  category,
  url,
  platform,
  attributes,
  rating
  // brand
}
