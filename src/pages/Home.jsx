import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { productApi, bannerApi } from '../api/productApi'
import { CATEGORY_META, CATEGORY_VALUES } from '../utils/categoryMeta'
import { formatCurrency } from '../utils/format'
import './Home.css'

export default function Home() {
  const [banners, setBanners] = useState([])
  const [slide, setSlide] = useState(0)
  const [featured, setFeatured] = useState([])
  const [deals, setDeals] = useState([])
  const [email, setEmail] = useState('')

  useEffect(() => {
    bannerApi.getAllPublic().then(setBanners).catch(() => setBanners([]))
    productApi.getAll(0, 8).then(setFeatured).catch(() => setFeatured([]))
    productApi
      .getAll(0, 50)
      .then((list) => setDeals(list.filter((p) => p.discountPrice != null)))
      .catch(() => setDeals([]))
  }, [])

  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  const handleNewsletter = (e) => {
    e.preventDefault()
    // No newsletter-subscription API exists on the backend — kept as a client-side
    // acknowledgement only, same as before, rather than inventing one.
    alert('Thank you for subscribing!')
    setEmail('')
  }

  const activeBanner = banners[slide]

  return (
    <div className="home">
      {/* HERO */}
      <section
        className="hero"
        style={
          activeBanner
            ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${activeBanner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, #1e8449 0%, #27ae60 50%, #58d68d 100%)' }
        }
      >
        <div className="container hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">{activeBanner?.title ?? 'Fresh Groceries, Delivered Fast'}</h1>
            <p className="hero-subtitle">Farm fresh produce and everyday essentials delivered to your door</p>
            <div className="hero-actions">
              <Link to="/shop" className="btn-primary">Shop Now <i className="fas fa-arrow-right"></i></Link>
              <Link to="/about" className="hero-learn">Learn More</Link>
            </div>
          </div>
        </div>
        {banners.length > 1 && (
          <div className="hero-dots">
            {banners.map((_, i) => (
              <button key={i} className={`dot ${i === slide ? 'active' : ''}`} onClick={() => setSlide(i)} />
            ))}
          </div>
        )}
      </section>

      {/* STATS */}
      <section className="stats-bar">
        <div className="container stats-inner">
          <div className="stat"><i className="fas fa-truck"></i><div><strong>Free Delivery</strong><span>On orders over ₹500</span></div></div>
          <div className="stat"><i className="fas fa-leaf"></i><div><strong>100% Fresh</strong><span>Directly from farms</span></div></div>
          <div className="stat"><i className="fas fa-shield-alt"></i><div><strong>Secure Payment</strong><span>100% safe & secure</span></div></div>
          <div className="stat"><i className="fas fa-headset"></i><div><strong>24/7 Support</strong><span>Dedicated support</span></div></div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">Find what you need quickly</p>
            </div>
            <Link to="/shop" className="view-all">View All <i className="fas fa-chevron-right"></i></Link>
          </div>
          <div className="categories-grid">
            {CATEGORY_VALUES.map((cat) => (
              <Link to={`/shop/${cat}`} key={cat} className="cat-card" style={{ background: CATEGORY_META[cat].color }}>
                <span className="cat-icon">{CATEGORY_META[cat].icon}</span>
                <span className="cat-name">{CATEGORY_META[cat].label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Fresh products for you</p>
            </div>
            <Link to="/shop" className="view-all">View All <i className="fas fa-chevron-right"></i></Link>
          </div>
          <div className="grid-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* DEALS BANNER */}
      {deals.length > 0 && (
        <section className="deals-banner">
          <div className="container deals-inner">
            <div className="deal-left">
              <span className="deal-tag">Special Offer</span>
              <h2>Deals of the Day</h2>
              <p>Discounted prices on select products, while stocks last.</p>
              <Link to="/shop" className="btn-primary">Shop Now <i className="fas fa-tag"></i></Link>
            </div>
            <div className="deal-right">
              <div className="deal-items">
                {deals.slice(0, 3).map((p) => (
                  <Link to={`/product/${p.id}`} key={p.id} className="deal-item">
                    <img src={p.imageUrl} alt={p.name} />
                    <div>
                      <span>{p.name}</span>
                      <strong>{formatCurrency(p.discountPrice)}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DEALS PRODUCTS */}
      {deals.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Today's Deals</h2>
                <p className="section-subtitle">Limited time offers — grab them fast!</p>
              </div>
              <Link to="/shop" className="view-all">See All Deals <i className="fas fa-chevron-right"></i></Link>
            </div>
            <div className="grid-4">
              {deals.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="section testimonials" style={{ background: 'white' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>What Our Customers Say</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: 40 }}>Real reviews from happy customers</p>
          <div className="grid-3">
            {[
              { name: 'Priya Sharma', text: 'Amazing quality and super fast delivery. The vegetables were so fresh, better than my local market!', rating: 5 },
              { name: 'Rahul Mehta', text: 'Great prices and wide variety. I love the weekly deals. Will definitely order again!', rating: 5 },
              { name: 'Anita Patel', text: 'Fantastic service. The app is easy to use and checkout is seamless. My go-to grocery store!', rating: 4 },
            ].map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="t-rating">
                  {Array.from({ length: 5 }, (_, j) => (
                    <i key={j} className={`fas fa-star ${j < t.rating ? 'filled' : ''}`}></i>
                  ))}
                </div>
                <p>"{t.text}"</p>
                <div className="t-author">
                  <div className="t-avatar">{t.name.charAt(0)}</div>
                  <strong>{t.name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter">
        <div className="container newsletter-inner">
          <div>
            <h2>Subscribe to Our Newsletter</h2>
            <p>Get the latest deals, new arrivals, and exclusive offers straight to your inbox.</p>
          </div>
          <form className="newsletter-form" onSubmit={handleNewsletter}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  )
}
