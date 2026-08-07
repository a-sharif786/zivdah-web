import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatCurrency } from '../utils/format'
import './Cart.css'

export default function Cart() {
  const { items, removeItem, updateQty, total, clearCart, appliedCoupon, applyCoupon, removeCoupon } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState(null)
  const [applying, setApplying] = useState(false)

  if (items.length === 0) return (
    <div className="empty-state" style={{ paddingTop: 100 }}>
      <i className="fas fa-shopping-cart"></i>
      <h3>Your cart is empty</h3>
      <p>Looks like you haven't added anything yet.</p>
      <Link to="/shop" className="btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
        <i className="fas fa-store"></i> Start Shopping
      </Link>
    </div>
  )

  const delivery = total >= 500 ? 0 : 40
  const tax = +(total * 0.05).toFixed(2)
  const discount = appliedCoupon?.discountAmount ?? 0
  const grandTotal = +(total + delivery + tax - discount).toFixed(2)

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    setCouponError(null)
    setApplying(true)
    try {
      await applyCoupon(couponInput.trim().toUpperCase())
    } catch (err) {
      setCouponError(err.message)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="cart-page">
      <div className="shop-breadcrumb">
        <div className="container">
          <Link to="/">Home</Link> <i className="fas fa-chevron-right"></i>
          <span>Shopping Cart</span>
        </div>
      </div>

      <div className="container cart-layout">
        <div className="cart-items">
          <div className="cart-header">
            <h2>Shopping Cart ({items.length} items)</h2>
            <button className="clear-btn" onClick={clearCart}>
              <i className="fas fa-trash"></i> Clear Cart
            </button>
          </div>

          <div className="cart-table">
            <div className="cart-table-head">
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
              <span></span>
            </div>
            {items.map(item => (
              <div key={item.id} className="cart-row">
                <div className="cart-product">
                  <img src={item.imageUrl} alt={item.name} />
                  <div>
                    <Link to={`/product/${item.productId}`} className="cart-product-name">{item.name}</Link>
                    <span className="cart-product-unit">{item.unit}</span>
                  </div>
                </div>
                <span className="cart-price">{formatCurrency(item.price)}</span>
                <div className="qty-control">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                </div>
                <span className="cart-total">{formatCurrency(item.price * item.quantity)}</span>
                <button className="remove-btn" onClick={() => removeItem(item.id)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-actions">
            <Link to="/shop" className="btn-secondary">
              <i className="fas fa-arrow-left"></i> Continue Shopping
            </Link>
          </div>
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>

          <div className="summary-rows">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className={delivery === 0 ? 'free' : ''}>
                {delivery === 0 ? 'FREE' : formatCurrency(delivery)}
              </span>
            </div>
            <div className="summary-row">
              <span>Tax (5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            {appliedCoupon && (
              <div className="summary-row">
                <span>Coupon ({appliedCoupon.code})</span>
                <span className="free">−{formatCurrency(discount)}</span>
              </div>
            )}
            {delivery > 0 && (
              <p className="delivery-note">
                <i className="fas fa-info-circle"></i>
                Add {formatCurrency(500 - total)} more for free delivery
              </p>
            )}
            <div className="summary-row total-row">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {appliedCoupon ? (
            <div className="coupon-row">
              <span style={{ flex: 1, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                <i className="fas fa-check-circle"></i> {appliedCoupon.code} applied
              </span>
              <button type="button" className="btn-secondary" onClick={removeCoupon}>Remove</button>
            </div>
          ) : (
            <form className="coupon-row" onSubmit={handleApplyCoupon}>
              <input
                type="text"
                placeholder="Coupon code (e.g. FRESH20)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
              />
              <button className="btn-secondary" disabled={applying || !couponInput.trim()}>
                {applying ? 'Applying...' : 'Apply'}
              </button>
            </form>
          )}
          {couponError && <p className="delivery-note" style={{ background: '#fdecea', color: '#c0392b' }}>{couponError}</p>}

          <Link to="/checkout" className="btn-primary checkout-btn">
            Proceed to Checkout <i className="fas fa-arrow-right"></i>
          </Link>

          <div className="secure-icons">
            <i className="fas fa-lock"></i>
            <span>Secure & Encrypted Checkout</span>
          </div>
        </div>
      </div>
    </div>
  )
}
