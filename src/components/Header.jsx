import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useTheme } from '../context/ThemeContext'
import { categoryApi } from '../api/productApi'
import './Header.css'
import logo from '../assets/logo.svg'

const navLinks = [
  { labelKey: 'header.navHome', path: '/' },
  { labelKey: 'header.navShop', path: '/shop' },
  { labelKey: 'header.navAbout', path: '/about' },
  { labelKey: 'header.navContact', path: '/contact' },
]

export default function Header() {
  const { t, i18n } = useTranslation()
  const { count } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()

  // Live categories table (GET /category/getAll) — display only, not yet linked to
  // product filtering (see Home.jsx / Shop.jsx comments), so these link to /shop
  // unfiltered rather than /shop/:category.
  useEffect(() => {
    categoryApi.getAllPublic().then(setCategories).catch(() => setCategories([]))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  const handleLogout = () => {
    setAccountOpen(false)
    logout()
    navigate('/login')
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi')
  }

  return (
    <header className="header">
      <div className="header-top">
        <div className="container header-top-inner">
          <span><i className="fas fa-phone-alt"></i> (022) 44830442</span>
          <span><i className="fas fa-envelope"></i> contact@zivdahonlinegrocery.com</span>
          <span><i className="fas fa-truck"></i> {t('common.freeDeliveryBanner')}</span>
        </div>
      </div>

      <div className="header-main">
        <div className="container header-main-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">
              <img src={logo} alt="Zivdah logo"/>
            </span>
            {/* <span className="logo-icon">🛒</span> */}
            <div>
              <div className="logo-name">Zivdah</div>
              <div className="logo-tagline">Online Grocery</div>
            </div>
          </Link>

          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={t('header.searchPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit"><i className="fas fa-search"></i></button>
          </form>

          <div className="header-actions">
            <button
              className="action-btn lang-btn"
              title={t('header.changeLanguage')}
              onClick={toggleLanguage}
            >
              {i18n.language === 'hi' ? 'EN' : 'हिं'}
            </button>
            <button
              className="action-btn"
              title={theme === 'dark' ? t('header.switchToLight') : t('header.switchToDark')}
              onClick={toggleTheme}
            >
              <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
            </button>
            {/* Hidden on mobile (see Header.css ≤768px block) — redundant there with the
                "Shop" link already in the hamburger nav below, and dropping it is one of
                the things that makes the header row actually fit on a phone. */}
            <Link to="/shop" className="action-btn action-btn-quicklink" title={t('header.shop')}>
              <i className="fas fa-store"></i>
            </Link>
            {isAuthenticated && (
              <Link to="/wishlist" className="action-btn" title={t('header.wishlist')}>
                <i className="fas fa-heart"></i>
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/notifications" className="action-btn" title={t('header.notifications')}>
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="cart-badge">{unreadCount}</span>}
              </Link>
            )}
            <Link to="/cart" className="action-btn cart-btn" title={t('header.cart')}>
              <i className="fas fa-shopping-cart"></i>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>

            <div className="account-menu">
              <button className="action-btn" title={t('header.account')} onClick={() => setAccountOpen((o) => !o)}>
                <i className="fas fa-user"></i>
              </button>
              {accountOpen && (
                <>
                  <div className="account-menu-backdrop" onClick={() => setAccountOpen(false)} />
                  <div className="account-dropdown">
                    {isAuthenticated ? (
                      <>
                        <div className="account-dropdown-greeting">{t('header.greeting', { name: user.name?.split(' ')[0] })}</div>
                        <Link to="/account" onClick={() => setAccountOpen(false)}>{t('header.myAccount')}</Link>
                        <Link to="/orders" onClick={() => setAccountOpen(false)}>{t('header.myOrders')}</Link>
                        <Link to="/notifications" onClick={() => setAccountOpen(false)}>{t('header.notifications')}</Link>
                        <Link to="/wishlist" onClick={() => setAccountOpen(false)}>{t('header.wishlist')}</Link>
                        <button onClick={handleLogout}>{t('header.logOut')}</button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setAccountOpen(false)}>{t('header.logIn')}</Link>
                        <Link to="/register" onClick={() => setAccountOpen(false)}>{t('header.createAccount')}</Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              <i className={`fas fa-${menuOpen ? 'times' : 'bars'}`}></i>
            </button>
          </div>
        </div>
      </div>

      <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
        <div className="container nav-inner">
          <ul className="nav-links">
            {navLinks.map(link => (
              <li key={link.path}>
                <Link to={link.path} onClick={() => setMenuOpen(false)}>{t(link.labelKey)}</Link>
              </li>
            ))}
          </ul>
          <div className="nav-cats">
            {categories.map((cat) => (
              <Link key={cat.id} to="/shop" onClick={() => setMenuOpen(false)}>
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt=""
                    style={{ width: 16, height: 16, objectFit: 'cover', borderRadius: 3, verticalAlign: 'middle', marginRight: 5 }}
                  />
                )}
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
