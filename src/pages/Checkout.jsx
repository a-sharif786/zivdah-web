import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderApi } from '../api/orderApi'
import { paymentApi } from '../api/paymentApi'
import { userApi } from '../api/userApi'
import { formatCurrency } from '../utils/format'
import './Checkout.css'

const PAYMENT_METHOD_MAP = { cod: 'COD', upi: 'UPI', card: 'CARD', netbanking: 'NET_BANKING' }

export default function Checkout() {
  const { items, total, clearCart, appliedCoupon } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)
  const [saveAddress, setSaveAddress] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: user?.email ?? '', phone: user?.mobile ?? '',
    address: '', city: '', state: '', pincode: '',
    payment: 'cod',
  })

  useEffect(() => {
    const [firstName = '', ...rest] = (user?.name ?? '').split(' ')
    setForm((f) => ({ ...f, firstName, lastName: rest.join(' '), email: user?.email ?? f.email, phone: user?.mobile ?? f.phone }))

    userApi.getAddresses(0, 1).then((addresses) => {
      const a = addresses[0]
      if (a) {
        setForm((f) => ({
          ...f,
          address: [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
          city: a.city,
          state: a.state,
          pincode: a.pinCode,
        }))
      }
    }).catch(() => {})
  }, [user])

  const delivery = total >= 500 ? 0 : 40
  const tax = +(total * 0.05).toFixed(2)
  const discount = appliedCoupon?.discountAmount ?? 0
  const grandTotal = +(total + delivery + tax - discount).toFixed(2)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const placeOrder = async () => {
    setError(null)
    setPlacing(true)
    try {
      if (saveAddress) {
        await userApi.addAddress({
          addressLine1: form.address,
          city: form.city,
          state: form.state,
          pinCode: form.pincode,
          isDefault: true,
        }).catch(() => {}) // best-effort — don't block checkout on this
      }

      const order = await orderApi.create({
        userId: user.id,
        subTotal: total,
        gstAmount: tax,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTaxAmount: tax,
        deliveryCharge: delivery,
        packagingCharge: 0,
        handlingCharge: 0,
        discountAmount: discount,
        couponCode: appliedCoupon?.code,
        totalAmount: grandTotal,
        currency: 'INR',
        deliveryAddressLine1: form.address,
        deliveryCity: form.city,
        deliveryState: form.state,
        deliveryPinCode: form.pincode,
        deliveryCountry: 'India',
        items: items.map((i) => ({
          productId: i.productId,
          vendorId: i.vendorId ?? null,
          quantity: i.quantity,
          price: i.price,
          subtotal: i.price * i.quantity,
        })),
      })

      const payment = await paymentApi.initiate({
        orderId: order.orderId,
        userId: user.id,
        amount: grandTotal,
        currency: 'INR',
        method: PAYMENT_METHOD_MAP[form.payment],
      })
      // No real payment gateway exists on the backend to redirect to — simulate
      // an immediate successful payment for every method, COD included.
      await paymentApi.markSuccess(payment.paymentId)

      await clearCart()
      navigate(`/orders/${order.orderId}`, { state: { justPlaced: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    placeOrder()
  }

  return (
    <div className="checkout-page">
      <div className="shop-breadcrumb">
        <div className="container">
          <Link to="/">Home</Link> <i className="fas fa-chevron-right"></i>
          <Link to="/cart">Cart</Link> <i className="fas fa-chevron-right"></i>
          <span>Checkout</span>
        </div>
      </div>

      <div className="container checkout-layout">
        <div className="checkout-form-wrap">
          <div className="checkout-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-num">1</div>
              <span>Delivery Info</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-num">2</div>
              <span>Payment</span>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="checkout-form">
            {step === 1 && (
              <div>
                <h3>Delivery Information</h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Rahul" required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Sharma" />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="rahul@email.com" required />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Address *</label>
                  <textarea name="address" value={form.address} onChange={handleChange} rows={3} placeholder="House No., Street, Area..." required />
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>City *</label>
                    <input name="city" value={form.city} onChange={handleChange} placeholder="Mumbai" required />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input name="state" value={form.state} onChange={handleChange} placeholder="Maharashtra" required />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="400001" required pattern="[0-9]{6}" />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} style={{ width: 'auto' }} />
                  Save this address to my account
                </label>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3>Payment Method</h3>
                <div className="payment-options">
                  {[
                    { value: 'cod', label: 'Cash on Delivery', icon: 'fas fa-money-bill-wave' },
                    { value: 'upi', label: 'UPI / Google Pay', icon: 'fas fa-mobile-alt' },
                    { value: 'card', label: 'Credit / Debit Card', icon: 'fas fa-credit-card' },
                    { value: 'netbanking', label: 'Net Banking', icon: 'fas fa-university' },
                  ].map(opt => (
                    <label key={opt.value} className={`payment-option ${form.payment === opt.value ? 'selected' : ''}`}>
                      <input type="radio" name="payment" value={opt.value} checked={form.payment === opt.value} onChange={handleChange} />
                      <i className={opt.icon}></i>
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <p className="auth-hint" style={{ marginTop: -8 }}>
                  This is a demo store — there's no real payment gateway. Your order will be confirmed immediately
                  regardless of the method chosen.
                </p>
              </div>
            )}

            <div className="form-actions">
              {step === 2 && (
                <button type="button" className="btn-secondary" onClick={() => setStep(1)} disabled={placing}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={placing}>
                {step === 1 ? 'Continue to Payment' : placing ? 'Placing Order...' : 'Place Order'}
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </form>
        </div>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="checkout-items">
            {items.map(item => (
              <div key={item.id} className="checkout-item">
                <img src={item.imageUrl} alt={item.name} />
                <div className="checkout-item-info">
                  <span className="checkout-item-name">{item.name}</span>
                  <span className="checkout-item-qty">x{item.quantity}</span>
                </div>
                <span className="checkout-item-price">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-rows">
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(total)}</span></div>
            <div className="summary-row"><span>Delivery</span><span className={delivery === 0 ? 'free' : ''}>{delivery === 0 ? 'FREE' : formatCurrency(delivery)}</span></div>
            <div className="summary-row"><span>Tax (5%)</span><span>{formatCurrency(tax)}</span></div>
            {appliedCoupon && <div className="summary-row"><span>Coupon ({appliedCoupon.code})</span><span className="free">−{formatCurrency(discount)}</span></div>}
            <div className="summary-row total-row"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
