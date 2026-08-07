import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { orderApi } from '../api/orderApi'
import { formatCurrency, formatDateTime } from '../utils/format'
import './Orders.css'

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    orderApi.getByUser(user.id).then(setOrders).catch((err) => setError(err.message))
  }, [user])

  return (
    <div className="container orders-page">
      <h1 className="section-title">My Orders</h1>

      {error && <div className="auth-error">{error}</div>}

      {!orders ? (
        <div className="empty-state">
          <i className="fas fa-spinner fa-spin"></i>
          <h3>Loading orders...</h3>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-receipt"></i>
          <h3>No orders yet</h3>
          <p>When you place an order, it will show up here.</p>
          <Link to="/shop" className="btn-primary" style={{ marginTop: 16 }}>Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((order) => (
              <Link to={`/orders/${order.orderId}`} key={order.orderId} className="order-card">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span className="order-card-date">{formatDateTime(order.createdAt)}</span>
                </div>
                <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span>
                <span className="order-card-total">{formatCurrency(order.totalAmount)}</span>
                <i className="fas fa-chevron-right"></i>
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
