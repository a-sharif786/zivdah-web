import { apiClient } from './client';

const BASE = '/restful/v1/api/products';
const BANNER_BASE = '/restful/v1/api/banner';

export const productApi = {
  getAll: (page = 0, size = 20) =>
    apiClient.get(`${BASE}/getAll`, { params: { page, size } }).then((r) => r.data),

  search: (keyword, page = 0, size = 20) =>
    apiClient.get(`${BASE}/search`, { params: { keyword, page, size } }).then((r) => r.data),

  getByCategory: (category, page = 0, size = 20) =>
    apiClient.get(`${BASE}/category/${category}`, { params: { page, size } }).then((r) => r.data),

  getById: (id) => apiClient.get(`${BASE}/${id}`).then((r) => r.data),

  getCategories: () => apiClient.get(`${BASE}/categories`).then((r) => r.data),

  getWishlist: (page = 0, size = 200) =>
    apiClient.get(`${BASE}/wishlist`, { params: { page, size } }).then((r) => r.data),

  updateWishlist: (id, fav) => apiClient.put(`${BASE}/${id}/wishlist`, { fav }).then((r) => r.data),
};

export const bannerApi = {
  getAllPublic: () => apiClient.get(`${BANNER_BASE}/getAll`).then((r) => r.data),
};

// The normalized categories table/CRUD resource (id, name, slug, parentId, imageUrl,
// active) — distinct from productApi.getCategories(), which returns the fixed
// ProductCategory enum (VEGETABLE/FRUIT/MILK/PULSE/GROCERY) that products still
// filter by. These new categories aren't linked to any product yet.
const CATEGORY_BASE = '/restful/v1/api/category';

export const categoryApi = {
  getAllPublic: () => apiClient.get(`${CATEGORY_BASE}/getAll`).then((r) => r.data),
};
