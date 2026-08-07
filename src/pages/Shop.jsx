import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { productApi } from '../api/productApi'
import { usePagedList } from '../hooks/usePagedList'
import { CATEGORY_META, CATEGORY_VALUES, categoryLabel } from '../utils/categoryMeta'
import './Shop.css'

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
]

export default function Shop() {
  const { category: categoryParam } = useParams()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''

  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All')
  const [sort, setSort] = useState('default')
  const [priceMax, setPriceMax] = useState(500)

  // Re-sync when navigating between /shop/:category links (route param changes)
  // rather than only reading it once at mount.
  useEffect(() => {
    setSelectedCategory(categoryParam || 'All')
  }, [categoryParam])

  const fetchPage = useCallback(
    (page, size) => {
      if (searchQuery) return productApi.search(searchQuery, page, size)
      if (selectedCategory !== 'All') return productApi.getByCategory(selectedCategory, page, size)
      return productApi.getAll(page, size)
    },
    [searchQuery, selectedCategory]
  )

  const { items, hasMore, loading, loadMore } = usePagedList(fetchPage, [searchQuery, selectedCategory])

  // Price/sort apply only to the currently-loaded page(s) — the backend has no
  // server-side price-range filter or sort, so this is a page-local refinement,
  // not a full-catalog one.
  const visible = items
    .filter((p) => (p.discountPrice ?? p.price) <= priceMax)
    .slice()
    .sort((a, b) => {
      const priceOf = (p) => p.discountPrice ?? p.price
      switch (sort) {
        case 'price-asc': return priceOf(a) - priceOf(b)
        case 'price-desc': return priceOf(b) - priceOf(a)
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })

  return (
    <div className="shop-page">
      <div className="shop-breadcrumb">
        <div className="container">
          <Link to="/">Home</Link> <i className="fas fa-chevron-right"></i>
          <span>Shop{selectedCategory !== 'All' ? ` / ${categoryLabel(selectedCategory)}` : ''}</span>
        </div>
      </div>

      <div className="container shop-layout">
        {/* SIDEBAR */}
        <aside className="shop-sidebar">
          <div className="sidebar-block">
            <h4>Categories</h4>
            <ul className="cat-filter-list">
              <li>
                <button className={selectedCategory === 'All' ? 'active' : ''} onClick={() => setSelectedCategory('All')}>
                  All
                </button>
              </li>
              {CATEGORY_VALUES.map((cat) => (
                <li key={cat}>
                  <button
                    className={selectedCategory === cat ? 'active' : ''}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <span>{CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-block">
            <h4>Price Range</h4>
            <input
              type="range"
              min="1"
              max="2000"
              value={priceMax}
              onChange={e => setPriceMax(Number(e.target.value))}
              className="price-range"
            />
            <div className="price-labels">
              <span>₹0</span>
              <span className="price-val">Up to ₹{priceMax}</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="shop-main">
          <div className="shop-toolbar">
            <p>{visible.length} products {searchQuery && `for "${searchQuery}"`}</p>
            <select value={sort} onChange={e => setSort(e.target.value)} className="sort-select">
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading && items.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-spinner fa-spin"></i>
              <h3>Loading products...</h3>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <div className="grid-4">
                {visible.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <button className="btn-secondary" onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
