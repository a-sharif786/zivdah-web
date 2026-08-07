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
