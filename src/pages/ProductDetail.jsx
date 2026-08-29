import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productApi } from '../api/productApi'
import { reviewApi } from '../api/reviewApi'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { useVendorName } from '../hooks/useVendorName'
import ProductCard from '../components/ProductCard'
import { categoryLabel } from '../utils/categoryMeta'
import { formatCurrency, formatDate } from '../utils/format'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const productId = Number(id)
  const { addItem } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { isWishlisted, toggle } = useWishlist()

  const [product, setProduct] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [related, setRelated] = useState([])
  const [reviews, setReviews] = useState([])
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('description')
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  const loadReviews = useCallback(() => {
    reviewApi.getByProduct(productId, 0, 50).then(setReviews).catch(() => setReviews([]))
  }, [productId])

  useEffect(() => {
    setProduct(null)
    setNotFound(false)
    setQty(1)
    productApi
      .getById(productId)
      .then((p) => {
        setProduct(p)
        productApi
          .getByCategory(p.category, 0, 5)
          .then((list) => setRelated(list.filter((r) => r.id !== p.id).slice(0, 4)))
          .catch(() => setRelated([]))
      })
      .catch(() => setNotFound(true))
    loadReviews()
  }, [productId, loadReviews])

  const vendorName = useVendorName(product?.vendorId)

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError(null)
    setSubmittingReview(true)
    try {
      await reviewApi.create({
        userId: user.id,
        productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      })
      setReviewForm({ rating: 5, comment: '' })
      loadReviews()
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  if (notFound) {
    return (
      <div className="container empty-state" style={{ paddingTop: 80 }}>
        <i className="fas fa-box-open"></i>
        <h3>Product not found</h3>
        <Link to="/shop" className="btn-primary" style={{ marginTop: 20 }}>Back to Shop</Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container empty-state" style={{ paddingTop: 80 }}>
        <i className="fas fa-spinner fa-spin"></i>
        <h3>Loading...</h3>
      </div>
    )
  }

  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price
  const discountPercent = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : null
  const displayPrice = hasDiscount ? product.discountPrice : product.price
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  const wishlisted = isAuthenticated && isWishlisted(product.id)

  return (
    <div className="product-detail-page">
      <div className="shop-breadcrumb">
        <div className="container">
          <Link to="/">Home</Link> <i className="fas fa-chevron-right"></i>
          <Link to="/shop">Shop</Link> <i className="fas fa-chevron-right"></i>
          <Link to={`/shop/${product.category}`}>{categoryLabel(product.category)}</Link> <i className="fas fa-chevron-right"></i>
          <span>{product.name}</span>
        </div>
      </div>

      <div className="container pd-layout">
        <div className="pd-images">
          <div className="pd-main-img">
            <img src={product.imageUrl} alt={product.name} />
            {hasDiscount && <span className="product-badge badge-sale">-{discountPercent}%</span>}
            <button
              type="button"
              className={`wishlist-btn pd-wishlist-btn ${wishlisted ? 'active' : ''}`}
              onClick={() => (isAuthenticated ? toggle(product) : null)}
              aria-label="Toggle wishlist"
            >
              <i className={wishlisted ? 'fas fa-heart' : 'far fa-heart'}></i>
            </button>
          </div>
        </div>

        <div className="pd-info">
          <span className="pd-category">{categoryLabel(product.category)}</span>
          <h1 className="pd-name">{product.name}</h1>

          {avgRating != null && (
            <div className="pd-rating">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={`fas fa-star ${i < Math.round(avgRating) ? 'filled' : ''}`}></i>
              ))}
              <span>{avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}

          <div className="pd-price">
            <span className="pd-price-current">{formatCurrency(displayPrice)}</span>
            {hasDiscount && <span className="pd-price-original">{formatCurrency(product.price)}</span>}
            {hasDiscount && <span className="pd-discount">{discountPercent}% OFF</span>}
          </div>

          <p className="pd-unit"><i className="fas fa-box"></i> Unit: {product.unit}</p>
          <p className="pd-stock">
            <i className={`fas fa-${product.inStock ? 'check-circle' : 'times-circle'}`}></i>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </p>
          {vendorName && (
            <p className="pd-vendor">
              <i className="fas fa-store"></i> Sold by {vendorName}
            </p>
          )}

          <div className="pd-qty-row">
            <div className="qty-control">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button
              className="btn-primary pd-add-btn"
              disabled={!product.inStock}
              onClick={() => addItem(product, qty)}
            >
              <i className="fas fa-shopping-cart"></i> Add to Cart
            </button>
          </div>

          <div className="pd-meta">
            <div><i className="fas fa-truck"></i> Free delivery on orders over ₹500</div>
            <div><i className="fas fa-undo"></i> Easy 7-day return policy</div>
            <div><i className="fas fa-shield-alt"></i> 100% fresh guarantee</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="container pd-tabs-section">
        <div className="pd-tabs">
          {['description', 'reviews'].map(t => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)} {t === 'reviews' && `(${reviews.length})`}
            </button>
          ))}
        </div>
        <div className="pd-tab-content">
          {tab === 'description' && (
            <div>
              <h3>Product Description</h3>
              <p>{product.description || `Experience the finest quality ${product.name} sourced directly from trusted farms and suppliers.`}</p>
              <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                {product.brand && <li>Brand: {product.brand}</li>}
                {product.organic && <li>Organic</li>}
                <li>Unit: {product.unit}</li>
                {product.expiryDate && <li>Best before: {formatDate(product.expiryDate)}</li>}
              </ul>
            </div>
          )}
          {tab === 'reviews' && (
            <div>
              {isAuthenticated ? (
                <form className="review-form" onSubmit={handleSubmitReview}>
                  <h4>Write a Review</h4>
                  {reviewError && <div className="auth-error">{reviewError}</div>}
                  <div className="review-stars-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fas fa-star ${star <= reviewForm.rating ? 'filled' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      ></i>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    required
                    maxLength={500}
                    placeholder="Share your thoughts about this product..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                  <button className="btn-primary" disabled={submittingReview} style={{ marginTop: 10 }}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <p className="auth-hint">
                  <Link to="/login">Log in</Link> to write a review.
                </p>
              )}

              <div className="reviews-list" style={{ marginTop: 24 }}>
                {reviews.length === 0 && <p>No reviews yet — be the first to review this product.</p>}
                {reviews.map((r) => (
                  <div key={r.id} className="review-item">
                    <div className="review-header">
                      <div className="t-avatar">U</div>
                      <div>
                        <strong>User #{r.userId}</strong>
                        <div className="review-stars">
                          {Array.from({ length: 5 }, (_, j) => (
                            <i key={j} className={`fas fa-star ${j < r.rating ? 'filled' : ''}`}></i>
                          ))}
                        </div>
                      </div>
                      <span className="review-date">{formatDate(r.createdAt)}</span>
                    </div>
                    <p>{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="section container">
          <h2 className="section-title">Related Products</h2>
          <div className="grid-4" style={{ marginTop: 24 }}>
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
