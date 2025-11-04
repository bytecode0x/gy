declare type Product = {
  id: string

  name: string

  name_en: string

  brand: string

  brand_en: string

  specifications?: string

  specifications_en?: string

  rating: number

  scraped_at: string

  main_images: Array<string>

  descriptive_images: Array<string>

  // review_images: Array<string>

  descriptions?: string

  descriptions_en?: string

  price: number

  price_unit: string

  options?: Record<string, Array<string>>

  price_matrix?: Record<string, number>

  price_matrix_key_separator?: string

  platform: string

  url: string

  category: string

  // category_separator: string

  weight?: number

  weight_unit?: string

  volume?: number

  volume_unit?: string

  attributes: Record<string, string>

  reviews: Array<{
    writer: string
    text: string
    images: Array<string>
    rating: number
    date: string
    attributes: Record<string, string>
    like: number
  }>
}
