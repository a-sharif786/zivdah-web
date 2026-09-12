import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { orderApi } from '../api/orderApi'
import { invoiceApi, openInvoiceBlob } from '../api/invoiceApi'
import { formatCurrency, formatDateTime } from '../utils/format'
import './Orders.css'

const CANCELLABLE_STATUSES = ['CREATED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED']

export default function OrderDetail() {
  const { orderId } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  // undefined = still checking, null = confirmed none generated yet (e.g. payment not
  // completed, or generation is still in flight) — either way the section just stays hidden.
  const [invoice, setInvoice] = useState(undefined)
  const [invoiceBusy, setInvoiceBusy] = useState(null)

  const load = useCallback(() => {
    orderApi.getById(orderId).then(setOrder).catch((err) => setError(err.message))
  }, [orderId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!order) return
    invoiceApi.getByOrderId(order.orderId).then(setInvoice).catch(() => setInvoice(null))
  }, [order])

  const handleInvoice = async (mode) => {
    if (!invoice) return
    setInvoiceBusy(mode === 'inline' ? 'view' : 'download')
    try {
      const blob = await invoiceApi.downloadBlob(invoice.id, mode)
      openInvoiceBlob(blob, `${invoice.invoiceNumber}.pdf`, mode)
    } catch (err) {
      setError(err.message)
    } finally {
      setInvoiceBusy(null)
    }
  }

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

          {invoice && (
            <>
              <h3 style={{ marginTop: 20 }}>Invoice</h3>
              <p className="order-date">{invoice.invoiceNumber} · {formatDateTime(invoice.invoiceDate)}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  className="btn-secondary"
                  onClick={() => handleInvoice('inline')}
                  disabled={invoiceBusy === 'view'}
                >
                  {invoiceBusy === 'view' ? 'Opening...' : 'View Invoice'}
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleInvoice('attachment')}
                  disabled={invoiceBusy === 'download'}
                >
                  {invoiceBusy === 'download' ? 'Downloading...' : 'Download Invoice'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Link to="/orders" className="btn-secondary" style={{ marginTop: 24, display: 'inline-flex' }}>
        <i className="fas fa-arrow-left"></i> Back to My Orders
      </Link>
    </div>
  )
}
