export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface BookshelfItemDTO {
  BookID: string
  Title: string
  Author: string
  cover_url?: string
}

export interface BookshelfResponse {
  items: BookshelfItemDTO[]
  pagination: Pagination
}
