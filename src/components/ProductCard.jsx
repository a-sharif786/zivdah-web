import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { categoryLabel } from '../utils/categoryMeta'
import { formatCurrency } from '../utils/format'
import './ProductCard.css'

const NEW_WITHIN_DAYS = 7

export default function ProductCard({ product }) {
  const { addItem, items } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const inCart = items.some(i => i.productId === product.id)
  const wishlisted = isAuthenticated && isWishlisted(product.id)

  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price
  const discountPercent = hasDiscount
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : null
  const displayPrice = hasDiscount ? product.discountPrice : product.price

  const isNew =
    !hasDiscount &&
    product.createdAt &&
    (Date.now() - new Date(product.createdAt).getTime()) / 86_400_000 <= NEW_WITHIN_DAYS

  const handleWishlist = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    toggle(product)
  }

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-img-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {hasDiscount && <span className="product-badge badge-sale">-{discountPercent}%</span>}
        {isNew && <span className="product-badge badge-new">NEW</span>}
        {!product.inStock && <span className="product-badge badge-outofstock">Out of Stock</span>}
        <button
          type="button"
          className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
        >
          <i className={wishlisted ? 'fas fa-heart' : 'far fa-heart'}></i>
        </button>
      </Link>

      <div className="product-info">
        <span className="product-category">{categoryLabel(product.category)}</span>
        <Link to={`/product/${product.id}`} className="product-name">{product.name}</Link>
        <div className="product-unit">{product.unit}</div>

        <div className="product-footer">
          <div className="product-price">
            <span className="price-current">{formatCurrency(displayPrice)}</span>
            {hasDiscount && <span className="price-original">{formatCurrency(product.price)}</span>}
          </div>
          <button
            className={`add-to-cart-btn ${inCart ? 'in-cart' : ''}`}
            disabled={!product.inStock}
            onClick={() => addItem(product)}
          >
            <i className={`fas fa-${inCart ? 'check' : 'shopping-cart'}`}></i>
          </button>
        </div>
      </div>
    </div>
  )
}
