import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { orderApi } from '../api/orderApi'
import { formatCurrency, formatDateTime } from '../utils/format'
import './Orders.css'

const CANCELLABLE_STATUSES = ['CREATED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED']

export default function OrderDetail() {
  const { orderId } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(() => {
    orderApi.getById(orderId).then(setOrder).catch((err) => setError(err.message))
  }, [orderId])

  useEffect(() => { load() }, [load])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await orderApi.cancel(orderId)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  if (error) {
    return (
      <div className="container empty-state" style={{ paddingTop: 80 }}>
        <i className="fas fa-exclamation-circle"></i>
        <h3>Could not load this order</h3>
        <p>{error}</p>
        <Link to="/orders" className="btn-primary" style={{ marginTop: 16 }}>My Orders</Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container empty-state" style={{ paddingTop: 80 }}>
        <i className="fas fa-spinner fa-spin"></i>
        <h3>Loading order...</h3>
      </div>
    )
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status)

  return (
    <div className="container order-detail-page">
      {location.state?.justPlaced && (
        <div className="order-confirmed-banner">
          <i className="fas fa-check-circle"></i>
          <div>
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for shopping with Zivdah. Your order confirmation is below.</p>
          </div>
        </div>
      )}

      <div className="order-detail-header">
        <div>
          <h1>Order {order.orderNumber}</h1>
          <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span>
        </div>
        {canCancel && (
          <button className="btn-secondary" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      <div className="order-detail-grid">
        <div className="order-items-card">
          <h3>Items</h3>
          {order.items.map((item, idx) => (
            <div key={idx} className="order-item-row">
              <span>Product #{item.productId}</span>
              <span>x{item.quantity}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="order-summary-card">
          <h3>Summary</h3>
          <div className="summary-rows">
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(order.subTotal)}</span></div>
            <div className="summary-row"><span>Tax</span><span>{formatCurrency(order.totalTaxAmount)}</span></div>
            <div className="summary-row"><span>Delivery</span><span>{formatCurrency(order.deliveryCharge)}</span></div>
            {order.discountAmount > 0 && (
              <div className="summary-row"><span>Discount ({order.couponCode})</span><span className="free">−{formatCurrency(order.discountAmount)}</span></div>
            )}
            <div className="summary-row total-row"><span>Total</span><span>{formatCurrency(order.totalAmount)}</span></div>
          </div>
          <h3 style={{ marginTop: 20 }}>Delivery Address</h3>
          <p className="order-address">
            {[order.deliveryAddressLine1, order.deliveryAddressLine2, order.deliveryCity, order.deliveryState, order.deliveryPinCode, order.deliveryCountry]
              .filter(Boolean).join(', ')}
          </p>
          <p className="order-date">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <Link to="/orders" className="btn-secondary" style={{ marginTop: 24, display: 'inline-flex' }}>
        <i className="fas fa-arrow-left"></i> Back to My Orders
      </Link>
    </div>
  )
}
