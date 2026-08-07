import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/ProductCard'
import './Wishlist.css'

export default function Wishlist() {
  const { products, loading } = useWishlist()

  return (
    <div className="container wishlist-page">
      <h1 className="section-title">My Wishlist</h1>
      {loading ? (
        <div className="empty-state">
          <i className="fas fa-spinner fa-spin"></i>
          <h3>Loading...</h3>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <i className="far fa-heart"></i>
          <h3>Your wishlist is empty</h3>
          <p>Tap the heart icon on any product to save it here.</p>
          <Link to="/shop" className="btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
        </div>
      ) : (
        <div className="grid-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
