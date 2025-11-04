/**
 * 수수료나 현지 배송비와 관련된 것들은 쇼피에서 반영하여 Shop price 로 계산하기 때문에
 * 이 것들을 뺀 상품 원가, 마진율, 국내 배송 비용 등만 고려하여 Global sku price 를 결정해주면 된다
 *
 */

/** @type { Product } */
const { product } = context

if (!product) throw new Error('NO_PRODUCT')

const translate = importPlugin('translate')

/** @type { string } */
// const brand_en = await translate({ text: product.brand, source: 'ko', target: 'en' })

// const name_en = await translate({ text: product.name, source: 'ko', target: 'en' })

const shipping_cost_offset = 0.4

// const transaction_fee = 1.02

// // SLS only for singapore
// const commission_fee = 1.11

// logistics service + box + aircap + etc
// 1$ = 1450won
// 3300 + 200 + 100 + 50
// aircap weight = around 10g
// box weight = around 100~120g
// pouch weight = around 100~150g

// pouch = 220won per 1 unit
// box = 200won per 1 unit
// aircap = 100won for 1 product

// small box volumne weight = 280~350g (which comes from w * l * h / 6000)
// 0.288
const default_volume_weight = (18 * 12 * 8) / 6000

// box + aircap + product
// 0.270
const default_weight = (110 + 10 + 150) / 1000

const domestic_logistics_cost = 2.52

// unit $
const product_cost = product.price_unit === 'won' ? Math.round((product.price / 1450) * 100) / 100 : product.price

const margin_rate = 1.3

// unit $
const global_sku_price = product_cost * margin_rate + domestic_logistics_cost + shipping_cost_offset

const global_sku_name = `[${product.brand_en.charAt(0).toUpperCase() + product.brand_en.slice(1)}] ${product.name_en} ${
  product.specifications_en || ''
}`

const sku_id = `${product.platform}_${[product.id]}`

// volume price = w * l * h / 6000
// 18 * 12 * 8 / 6000 = 0.288

// cm^3
let volume

// kg
let weight

// 🌸 How to use

// 🌸 FAQ

// ${await translate({
//   text: Object.entries(product.attributes)
//     .map(([key, value]) => `${key}: ${value}`)
//     .join('\n'),
//   source: 'ko',
//   target: 'en'
// })}

const product_description = `
🌸 Descriptions 🌸
${global_sku_name}
rating: ${product.rating} / 5

🌸 Pinklet 🌸
All items are shipped directly from Korea 
200% refund if the product is not authentic !
Your satisfaction is our top priority 
We always do our best to provide high-quality products at the best prices
Feel free to contact us anytime if you have any questions or suggestions !
`.trim()

Object.assign(context, {
  global_sku_name,
  global_sku_price,
  product_description,
  default_volume_weight,
  default_weight,
  sku_id
})

await log({
  msg: {
    global_sku_name,
    global_sku_price,
    product_description,
    default_volume_weight,
    default_weight,
    product,
    sku_id
  }
})
await log({
  msg: {
    global_sku_name,
    global_sku_price,
    product_description,
    default_volume_weight,
    default_weight,
    product,
    sku_id
  },
  tabId: parseInt(neo.stringify(edward.topDownSearch({ tree, key: 'ext' })), 10)
})
