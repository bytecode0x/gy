/** @type { Product } */
const { product } = context

if (!product) throw new Error('NO_PRODUCT')

const { global_sku_name, global_sku_price, product_description, default_volume_weight, default_weight, sku_id } =
  context

const categoryId = context.category_id

const imageUrls = context.image_web_urls

const shopee_beauty_template_row = [
  // Category
  categoryId,
  // Product Name
  global_sku_name,
  // Product Description
  product_description,
  // Parent KSU
  '',
  // Variation Integration No.
  '',
  // Variation Name1
  'option',
  // 'Option for Variation 1'
  product.specifications_en || 'option1',
  // 'Image per Variation'
  '',
  // 'Variation Name2'
  '',
  // 'Option for Variation 2'
  '',
  // 'Global SKU Price':
  Math.round(global_sku_price * 10) / 10,
  //Stock:
  10,
  // SKU:
  sku_id,
  // upload images on web so that shopee can access to
  //'Cover image':
  imageUrls.at(1) || '',
  //'Item Image 1':
  imageUrls.at(0) || '',
  // 'Item Image 2':
  imageUrls.at(2) || '',
  // 'Item Image 3':
  imageUrls.at(3) || '',
  // 'Item Image 4':
  imageUrls.at(4) || '',
  // 'Item Image 5':
  imageUrls.at(5) || '',
  // 'Item Image 6':
  imageUrls.at(6) || '',
  // 'Item Image 7':
  imageUrls.at(7) || '',
  // 'Item Image 8':
  imageUrls.at(8) || '',
  // 'Size Chart Template':
  '',
  // 'Size Chart Image':
  '',
  // need assertion ?
  // Weight:
  default_weight,
  // Length:
  '',
  // Width:
  '',
  // Height:
  '',
  //'Days to ship':
  '4',
  // assert brand id
  // Brand:
  product.brand_en,
  // 'False Lash Volume':
  '',
  // 'Shelf Life': 1 Month 2 Months 3 Months 6 Months 12 Months 24 Months
  '24 Months',
  // 'Nail Polish Type':
  '',
  // 'Pack Type':
  '',
  // 'Packaging Type':
  '',
  // 'Product Size':
  '',
  // Gender:
  '',
  // 'Application Area':
  '',
  // Scent:
  '',
  // 'Cleanser Type':
  '',
  // 'Lip Benefits':
  '',
  // assert formulation id
  // Formulation:
  '',
  // 'Region of Origin': Japan Australia Mainland China Korea Europe Indonesia Malaysia Others Philippines Singapore America Taiwan Thailand Vietnam England France Brasil Colombia Chile Argentina Mexico
  'Korea',
  // 'Ingredient Preference':
  '',
  // 'Skin Type': 'Acne-prone' 'All Skin Type' 'Combination Skin' 'Dry' 'Dull' 'Normal' 'Oily Skin' 'Sensitive'
  '',
  // 'Lotion Type':
  '',
  // 'Makeup Finish':
  '',
  // 'Power Source':
  '',
  // Handmade:
  '',
  // 'Expiry Date':
  '',
  // 'Hair Finish':
  '',
  // 'Foundation Coverage':
  '',
  // 'Mask Type':
  '',
  // 'Body Care Benefits':
  '',
  // 'Mascara Benefits':
  '',
  // 'Makeup Remover Type':
  '',
  // 'Fragrance Concentration':
  '',
  // 'Sets & Packages Type':
  '',
  // 'Makeup Brush Type':
  '',
  // 'Skin Care Benefits':
  '',
  // 'Electrical Device':
  '',
  // 'Nutrient Type':
  '',
  // 'Hair Care Benefits':
  '',
  // 'Warranty Duration':
  '',
  // Feature:
  '',
  // 'Specialty Type':
  '',
  // Material:
  '',
  // Features:
  '',
  // 'Bag Closure':
  '',
  // 'Acne Treatment Type':
  '',
  // Volume:
  '',
  // Waterproof:
  '',
  // 'Skin Tone':
  '',
  // SPF:
  '',
  // 'Battery Capacity':
  '',
  // 'Corded/ Cordless':
  '',
  // 'Input Voltage':
  '',
  // 'Power Consumption':
  '',
  // 'Warranty Type':
  '',
  // 'Plug Type':
  '',
  // 'Build-in Battery':
  '',
  // 'Age Group':
  '',
  // 'Edition Type':
  '',
  // 'Tool Function':
  '',
  // 'Safety Mark':
  '',
  // 'FDA Registration No.':
  '',
  // 'TIS No.':
  '',
  // 'Advertisement License No.':
  '',
  // BSMI:
  '',
  // NCC:
  '',
  // Ingredient:
  '',
  // Quantity:
  '',
  // 'Days to Expire':
  '',
  // 'Pack Size':
  '',
  // 'Storage Condition':
  '',
  // 'TIS Certificate No.':
  '',
  // 'Manufacture Date':
  '',
  // 'Production batch number':
  '',
  // 'Manufacturer/trader name':
  '',
  // 'Manufacturer/trader address':
  '',
  // 'INVIMA certification':
  '',
  // 'SIRIM Certified':
  '',
  // 'Custom Product':
  '',
  // 'HSA Notification No.':
  '',
  // 'Bureau of Standards, Metrology and Inspection':
  '',
  // 'Labled in Chinese':
  '',
  // 'Filed product registration or inspection permit':
  '',
  // 'Certificate No. (SNI, K3L, UTTP)':
  '',
  // 'Official Distribution Authorization No.':
  '',
  // NA:
  '',
  // 'Care Instructions':
  '',
  // 'Quantity per Pack':
  '',
  // 'Hair Type':
  '',
  // Magnetic:
  '',
  // 'TIS license website':
  '',
  // 'Item Batch code':
  '',
  // 'Item Code':
  '',
  // 'Exemption Reason':
  '',
  // 'Alcohol Or Aerosol':
  '',
  // 'Allergen Information':
  '',
  // 'Bag Type':
  '',
  // 'Bath & Body Care Type':
  '',
  // 'Batteries Included':
  '',
  // Franchise:
  '',
  // 'Hair Dryer Features':
  '',
  // 'Heatless Styling Tool Type':
  '',
  // 'Lip Treatment Type':
  '',
  // 'Makeup Tool Type':
  '',
  // 'Manicure & Pedicure Tool Type':
  '',
  // "Men'S Makeup Type":
  '',
  // "Men's Skincare Type":
  '',
  // 'Number of Batteries':
  '',
  // 'Number Of Mode':
  '',
  // 'Set Type':
  '',
  // 'Skincare Tool Type':
  '',
  // 'Item Qty. same batch':
  '',
  // 'Expire Date':
  '',
  // 'SIRIM-ST Certificate & Label':
  '',
  // 'SIRIM Certificate of Conformity (CoC)':
  '',
  // 'NPRA Notification':
  '',
  // 'HALAL Certificates':
  '',
  // 'Certification/License':
  '',
  // 'Certificate/Registration No.':
  '',
  // 'Appliances Type':
  '',
  // 'Manicure Tool Type':
  '',
  // 'SIRIM-ST Certificate & Label No.':
  '',
  // 'SIRIM Certificate of Conformity (CoC) No.':
  '',
  // 'NPRA Notification No.':
  '',
  // 'HALAL Certificates No.':
  '',
  //'SIRIM Certified No.':
  ''
]

Object.assign(context, { shopee_beauty_template_row })
