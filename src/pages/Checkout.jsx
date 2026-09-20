import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderApi } from '../api/orderApi'
import { paymentApi } from '../api/paymentApi'
import { userApi } from '../api/userApi'
import { formatCurrency } from '../utils/format'
import './Checkout.css'

const PAYMENT_METHOD_MAP = { cod: 'COD', upi: 'UPI', card: 'CARD', netbanking: 'NET_BANKING' }

// EcomWorldPay's UPI status-check is polled every 4s while a QR is showing, for up to ~6
// minutes — long enough for a customer to switch to their UPI app and pay, short enough that an
// abandoned tab doesn't poll forever.
const UPI_POLL_INTERVAL_MS = 4000
const UPI_POLL_MAX_ATTEMPTS = 90

// EcomWorldPay's own UPI intent bounds (inferred from its rejection text — "Please generate
// intent again within ₹100 - ₹25000 amount range" — there's no config/endpoint exposing these).
// Checked client-side so an out-of-range cart never reaches the backend at all, and never
// creates an order.
const UPI_MIN_AMOUNT = 100
const UPI_MAX_AMOUNT = 25000

export default function Checkout() {
  const { items, total, clearCart, appliedCoupon } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)
  const [saveAddress, setSaveAddress] = useState(false)
  const [addresses, setAddresses] = useState([])
  // Id of the selected saved address, or 'new' to show the manual-entry fields.
  // Starts 'new' so the form still works before the address list loads / for
  // users with no saved addresses.
  const [selectedAddressId, setSelectedAddressId] = useState('new')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: user?.email ?? '', phone: user?.mobile ?? '',
    address: '', city: '', state: '', pincode: '',
    payment: 'upi', // default selection — see the radio list below for what's actually offered
  })
  // UPI QR flow — populated once EcomWorldPay's QR API returns an intent (see placeOrder).
  const [upiPayment, setUpiPayment] = useState(null) // { orderId, paymentId, qrDataUrl }
  const [upiStatus, setUpiStatus] = useState('processing') // 'processing' | 'failed' | 'timeout'
  // The payment gateway's own error text for a FAILED payment (see payment-service's
  // PaymentResponseDto.failureReason) — shown to the customer verbatim, whatever it says.
  const [upiFailureReason, setUpiFailureReason] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const pollTimerRef = useRef(null)
  // One id per checkout attempt, shared by the order-create and payment-initiate calls (see
  // placeOrder). Reset below whenever the cart actually changes; kept as-is across a failed
  // attempt so retrying "Place Order" is idempotent instead of creating a duplicate order/payment.
  const checkoutRefRef = useRef(null)

  const applyAddress = (a) => {
    setForm((f) => ({
      ...f,
      address: [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
      city: a.city,
      state: a.state,
      pincode: a.pinCode,
    }))
  }

  const selectNewAddress = () => {
    setSelectedAddressId('new')
    setForm((f) => ({ ...f, address: '', city: '', state: '', pincode: '' }))
  }

  useEffect(() => {
    const [firstName = '', ...rest] = (user?.name ?? '').split(' ')
    setForm((f) => ({ ...f, firstName, lastName: rest.join(' '), email: user?.email ?? f.email, phone: user?.mobile ?? f.phone }))

    userApi.getAddresses(0, 20).then((list) => {
      setAddresses(list)
      const def = list.find((a) => a.isDefault) ?? list[0]
      if (def) {
        setSelectedAddressId(def.id)
        applyAddress(def)
      }
    }).catch(() => {})
  }, [user])

  const delivery = total >= 500 ? 0 : 40
  const tax = +(total * 0.05).toFixed(2)
  const discount = appliedCoupon?.discountAmount ?? 0
  const grandTotal = +(total + delivery + tax - discount).toFixed(2)

  // A materially different cart/coupon is a new checkout attempt — start it with a fresh id.
  // `items`/`appliedCoupon` are stable references from CartContext (state, not recreated on
  // unrelated re-renders), so this doesn't fire on every render — only when the cart really changes.
  useEffect(() => {
    checkoutRefRef.current = null
  }, [items, total, appliedCoupon])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  // Runs before any network call — catches the common failure classes for free (no round-trip,
  // no order/payment ever created for these).
  const validateBeforeSubmit = () => {
    if (items.length === 0) {
      setError('Your cart is empty.')
      return false
    }
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      setError('Please provide a complete delivery address.')
      return false
    }
    if (form.payment === 'upi' && (grandTotal < UPI_MIN_AMOUNT || grandTotal > UPI_MAX_AMOUNT)) {
      setError(
        `UPI payments must be between ${formatCurrency(UPI_MIN_AMOUNT)} and ${formatCurrency(UPI_MAX_AMOUNT)}. ` +
          'Choose Cash on Delivery instead, or adjust your cart.'
      )
      return false
    }
    return true
  }

  const placeOrder = async () => {
    setError(null)
    if (!validateBeforeSubmit()) return
    setPlacing(true)
    try {
      if (!checkoutRefRef.current) checkoutRefRef.current = crypto.randomUUID()
      const checkoutRef = checkoutRefRef.current

      if (selectedAddressId === 'new' && saveAddress) {
        await userApi.addAddress({
          addressLine1: form.address,
          city: form.city,
          state: form.state,
          pinCode: form.pincode,
          isDefault: true,
        }).catch(() => {}) // best-effort — don't block checkout on this
      }

      const method = PAYMENT_METHOD_MAP[form.payment]

      // Validate/create the payment intent FIRST, before any order exists — if the gateway
      // rejects it (e.g. amount out of range), nothing is ever persisted as an order. checkoutRef
      // is left untouched on failure, so clicking "Place Order" again safely retries this same
      // attempt instead of creating a duplicate (see PaymentServiceImpl#initiatePayment).
      const payment = await paymentApi.initiate({
        checkoutRef,
        userId: user.id,
        amount: grandTotal,
        currency: 'INR',
        method,
        ...(method === 'UPI' ? {
          firstName: form.firstName,
          lastName: form.lastName.trim() || form.firstName,
          mobile: form.phone.replace(/[^0-9]/g, ''),
          email: form.email,
        } : {}),
      })

      if (method === 'UPI' && !payment.upiIntent) {
        // The gateway rejected intent creation outright (e.g. duplicate invoice, IP not
        // whitelisted, amount out of range) — surface its own message, not a generic one. No
        // order was created for this attempt.
        throw new Error(payment.failureReason || 'Could not start UPI payment. Please choose a different payment method.')
      }

      // Intent accepted (or COD/other with no gateway step) — only now is it safe to create the
      // order. idempotencyKey is the same checkoutRef, so even a network retry of this call can't
      // create a second order (see OrderServiceImpl#createOrder).
      const order = await orderApi.create({
        idempotencyKey: checkoutRef,
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

      // Attach the real order to the already-accepted payment intent.
      await paymentApi.linkOrder(payment.paymentId, order.orderId)

      if (method === 'COD') {
        // No payment collected now — the order stays unpaid (order.status starts at CREATED)
        // until whoever collects the cash on delivery marks it paid.
        await clearCart()
        navigate(`/orders/${order.orderId}`, { state: { justPlaced: true } })
        return
      }

      if (method !== 'UPI') {
        // No real gateway integration for these yet — simulate an immediate successful payment.
        await paymentApi.markSuccess(payment.paymentId)
        await clearCart()
        navigate(`/orders/${order.orderId}`, { state: { justPlaced: true } })
        return
      }

      const qrDataUrl = await QRCode.toDataURL(payment.upiIntent)
      setUpiPayment({ orderId: order.orderId, paymentId: payment.paymentId, qrDataUrl })
      setUpiStatus('processing')
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  // Polls our own payment record (cheap — just a DB read) while the QR is showing, so the page
  // advances automatically once EcomWorldPay's async callback lands. "Check now" below instead
  // forces an active poll against the gateway itself, for when the callback is delayed/missed.
  useEffect(() => {
    if (step !== 3 || !upiPayment || upiStatus !== 'processing') return undefined
    let cancelled = false
    let attempts = 0

    const finishIfSettled = async (latest) => {
      if (latest.status === 'SUCCESS') {
        setUpiStatus('success')
        await clearCart()
        navigate(`/orders/${upiPayment.orderId}`, { state: { justPlaced: true } })
        return true
      }
      if (latest.status === 'FAILED') {
        setUpiFailureReason(latest.failureReason || null)
        setUpiStatus('failed')
        return true
      }
      return false
    }

    const poll = async () => {
      attempts += 1
      try {
        const latest = await paymentApi.getById(upiPayment.paymentId)
        if (cancelled) return
        if (await finishIfSettled(latest)) return
      } catch {
        // transient network error — keep polling rather than failing the whole checkout
      }
      if (cancelled) return
      if (attempts < UPI_POLL_MAX_ATTEMPTS) {
        pollTimerRef.current = setTimeout(poll, UPI_POLL_INTERVAL_MS)
      } else {
        setUpiStatus('timeout')
      }
    }

    pollTimerRef.current = setTimeout(poll, UPI_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearTimeout(pollTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, upiPayment, upiStatus])

  const checkUpiStatusNow = async () => {
    if (!upiPayment) return
    setCheckingStatus(true)
    setError(null)
    try {
      const latest = await paymentApi.getGatewayStatus(upiPayment.paymentId)
      if (latest.status === 'SUCCESS') {
        setUpiStatus('success')
        await clearCart()
        navigate(`/orders/${upiPayment.orderId}`, { state: { justPlaced: true } })
      } else if (latest.status === 'FAILED') {
        setUpiFailureReason(latest.failureReason || null)
        setUpiStatus('failed')
      }
      // still PENDING/PROCESSING — the background poller above keeps waiting
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingStatus(false)
    }
  }

  const retryPayment = () => {
    setUpiPayment(null)
    setUpiStatus('processing')
    setUpiFailureReason(null)
    setStep(2)
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

          {step < 3 && (
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
                {addresses.length > 0 && (
                  <div className="form-group">
                    <label>Delivery Address *</label>
                    <div className="address-list">
                      {addresses.map((a) => (
                        <label key={a.id} className={`address-option ${selectedAddressId === a.id ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="savedAddress"
                            checked={selectedAddressId === a.id}
                            onChange={() => { setSelectedAddressId(a.id); applyAddress(a) }}
                          />
                          <div>
                            <strong>
                              {[a.addressLine1, a.addressLine2].filter(Boolean).join(', ')}
                              {a.isDefault && <span className="address-default-badge">Default</span>}
                            </strong>
                            <div>{a.city}, {a.state} - {a.pinCode}</div>
                          </div>
                        </label>
                      ))}
                      <label className={`address-option ${selectedAddressId === 'new' ? 'selected' : ''}`}>
                        <input type="radio" name="savedAddress" checked={selectedAddressId === 'new'} onChange={selectNewAddress} />
                        <div><strong><i className="fas fa-plus"></i> Add a new address</strong></div>
                      </label>
                    </div>
                  </div>
                )}
                {selectedAddressId === 'new' && (
                  <>
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
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h3>Payment Method</h3>
                <div className="payment-options">
                  {[
                    { value: 'upi', label: 'UPI / Qr Code', icon: 'fas fa-mobile-alt' },
                  //  { value: 'cod', label: 'Cash on Delivery', icon: 'fas fa-money-bill-wave' },
                    // { value: 'card', label: 'Credit / Debit Card', icon: 'fas fa-credit-card' },
                    // { value: 'netbanking', label: 'Net Banking', icon: 'fas fa-university' },
                  ].map(opt => (
                    <label key={opt.value} className={`payment-option ${form.payment === opt.value ? 'selected' : ''}`}>
                      <input type="radio" name="payment" value={opt.value} checked={form.payment === opt.value} onChange={handleChange} />
                      <i className={opt.icon}></i>
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <p className="auth-hint" style={{ marginTop: -8 }}>
                  {form.payment === 'upi'
                    ? "You'll be shown a UPI QR code to scan and pay with any UPI app."
                    // : form.payment === 'cod'
                    // ? 'Pay with cash when your order is delivered.'
                    : "This payment method doesn't have a live gateway yet — your order will be confirmed immediately."}
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
          )}

          {step === 3 && upiPayment && (
            <div className="checkout-form upi-qr-panel">
              <h3>Scan &amp; Pay via UPI</h3>

              {upiStatus === 'processing' && (
                <>
                  <div className="upi-qr-image">
                    <img src={upiPayment.qrDataUrl} alt="UPI QR code" />
                  </div>
                  <p className="upi-qr-amount">{formatCurrency(grandTotal)}</p>
                  <p className="auth-hint">
                    Scan this code with any UPI app (Google Pay, PhonePe, Paytm...) to pay. This page updates
                    automatically once the payment is received.
                  </p>
                  <div className="upi-qr-status">
                    <i className="fas fa-spinner fa-spin"></i> Waiting for payment confirmation...
                  </div>
                  <button type="button" className="btn-secondary" onClick={checkUpiStatusNow} disabled={checkingStatus}>
                    {checkingStatus ? 'Checking...' : "I've paid, check now"}
                  </button>
                </>
              )}

              {upiStatus === 'failed' && (
                <>
                  <p className="auth-error">{upiFailureReason || 'Payment failed or was declined. Please try again.'}</p>
                  <button type="button" className="btn-primary" onClick={retryPayment}>
                    Choose Payment Method Again
                  </button>
                </>
              )}

              {upiStatus === 'timeout' && (
                <>
                  <p className="auth-hint">
                    Still waiting for confirmation — if you've already paid, this can occasionally take a little
                    longer to reflect.
                  </p>
                  <button type="button" className="btn-secondary" onClick={checkUpiStatusNow} disabled={checkingStatus}>
                    {checkingStatus ? 'Checking...' : 'Check Again'}
                  </button>
                  <button type="button" className="btn-primary" onClick={retryPayment} style={{ marginLeft: 12 }}>
                    Choose a Different Method
                  </button>
                </>
              )}
            </div>
          )}
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
