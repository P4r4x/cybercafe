export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface BookshelfItemDTO {
  book_id: string
  title: string
  author: string
  cover_url?: string
}

export interface BookshelfResponse {
  items: BookshelfItemDTO[]
  pagination: Pagination
}
