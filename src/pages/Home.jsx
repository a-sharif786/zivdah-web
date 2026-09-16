import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProductCard from '../components/ProductCard'
import { productApi, bannerApi, categoryApi } from '../api/productApi'
import { formatCurrency } from '../utils/format'
import './Home.css'

export default function Home() {
  const { t } = useTranslation()
  const [banners, setBanners] = useState([])
  const [slide, setSlide] = useState(0)
  const [featured, setFeatured] = useState([])
  const [deals, setDeals] = useState([])
  const [email, setEmail] = useState('')
  // From the new categories CRUD table (GET /category/getAll) — id/name/imageUrl,
  // not the old ProductCategory enum. Not yet linked to any product (no category_id
  // on products), so cards below are display-only and link to /shop unfiltered.
  const [categories, setCategories] = useState([])

  useEffect(() => {
    bannerApi.getAllPublic().then(setBanners).catch(() => setBanners([]))
    productApi.getAll(0, 8).then(setFeatured).catch(() => setFeatured([]))
    productApi
      .getAll(0, 50)
      .then((list) => setDeals(list.filter((p) => p.discountPrice != null)))
      .catch(() => setDeals([]))
    categoryApi.getAllPublic().then(setCategories).catch(() => setCategories([]))
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
    alert(t('home.subscribeThankYou'))
    setEmail('')
  }

  const activeBanner = banners[slide]
  const testimonialRatings = [5, 5, 4]
  const testimonials = t('home.testimonials', { returnObjects: true }).map((item, i) => ({
    ...item,
    rating: testimonialRatings[i],
  }))

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
            <h1 className="hero-title">{activeBanner?.title ?? t('home.heroTitleDefault')}</h1>
            <p className="hero-subtitle">{t('home.heroSubtitle')}</p>
            <div className="hero-actions">
              <Link to="/shop" className="btn-primary">{t('common.shopNow')} <i className="fas fa-arrow-right"></i></Link>
              <Link to="/about" className="hero-learn">{t('home.learnMore')}</Link>
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
          <div className="stat"><i className="fas fa-truck"></i><div><strong>{t('home.statFreeDeliveryTitle')}</strong><span>{t('home.statFreeDeliverySub')}</span></div></div>
          <div className="stat"><i className="fas fa-leaf"></i><div><strong>{t('home.stat100FreshTitle')}</strong><span>{t('home.stat100FreshSub')}</span></div></div>
          <div className="stat"><i className="fas fa-shield-alt"></i><div><strong>{t('home.statSecureTitle')}</strong><span>{t('home.statSecureSub')}</span></div></div>
          <div className="stat"><i className="fas fa-headset"></i><div><strong>{t('home.statSupportTitle')}</strong><span>{t('home.statSupportSub')}</span></div></div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t('home.shopByCategory')}</h2>
              <p className="section-subtitle">{t('home.findWhatYouNeed')}</p>
            </div>
            <Link to="/shop" className="view-all">{t('common.viewAll')} <i className="fas fa-chevron-right"></i></Link>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              // Links to /shop unfiltered, not /shop/:category — these categories
              // aren't wired to product filtering yet (see state comment above).
              <Link
                to="/shop"
                key={cat.id}
                className="cat-card"
                style={
                  cat.imageUrl
                    ? {
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url(${cat.imageUrl})`,
                      backgroundSize: 'cover',
                      height: '200px',
                      width: '100%',
                      backgroundPosition: 'center',
                    }
                    : {
                      background: '#78909c',
                      height: '200px',
                      width: '100%',
                    }
                }
              >
                <span className="cat-name" style={{ color: '#fff' }}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t('home.featuredProducts')}</h2>
              <p className="section-subtitle">{t('home.freshProductsForYou')}</p>
            </div>
            <Link to="/shop" className="view-all">{t('common.viewAll')} <i className="fas fa-chevron-right"></i></Link>
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
              <span className="deal-tag">{t('home.specialOffer')}</span>
              <h2>{t('home.dealsOfTheDay')}</h2>
              <p>{t('home.dealsDescription')}</p>
              <Link to="/shop" className="btn-primary">{t('common.shopNow')} <i className="fas fa-tag"></i></Link>
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
                <h2 className="section-title">{t('home.todaysDeals')}</h2>
                <p className="section-subtitle">{t('home.limitedTimeOffers')}</p>
              </div>
              <Link to="/shop" className="view-all">{t('home.seeAllDeals')} <i className="fas fa-chevron-right"></i></Link>
            </div>
            <div className="grid-4">
              {deals.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="section testimonials" style={{ background: 'var(--white)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>{t('home.whatCustomersSay')}</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: 40 }}>{t('home.realReviews')}</p>
          <div className="grid-3">
            {testimonials.map((item, i) => (
              <div key={i} className="testimonial-card">
                <div className="t-rating">
                  {Array.from({ length: 5 }, (_, j) => (
                    <i key={j} className={`fas fa-star ${j < item.rating ? 'filled' : ''}`}></i>
                  ))}
                </div>
                <p>"{item.text}"</p>
                <div className="t-author">
                  <div className="t-avatar">{item.name.charAt(0)}</div>
                  <strong>{item.name}</strong>
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
            <h2>{t('home.subscribeTitle')}</h2>
            <p>{t('home.subscribeDescription')}</p>
          </div>
          <form className="newsletter-form" onSubmit={handleNewsletter}>
            <input
              type="email"
              placeholder={t('home.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">{t('home.subscribe')}</button>
          </form>
        </div>
      </section>
    </div>
  )
}
