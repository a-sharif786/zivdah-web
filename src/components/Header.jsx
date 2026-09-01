import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useTheme } from '../context/ThemeContext'
import { categoryApi } from '../api/productApi'
import './Header.css'
import logo from '../assets/logo.svg'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/shop' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
]

export default function Header() {
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
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header-top">
        <div className="container header-top-inner">
          <span><i className="fas fa-phone-alt"></i> (022) 44830442</span>
          <span><i className="fas fa-envelope"></i> contact@zivdahonlinegrocery.com</span>
          <span><i className="fas fa-truck"></i> Free delivery on orders over ₹500</span>
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
              placeholder="Search for groceries, fruits, vegetables..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit"><i className="fas fa-search"></i></button>
          </form>

          <div className="header-actions">
            <button
              className="action-btn"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
            >
              <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
            </button>
            <Link to="/shop" className="action-btn" title="Shop">
              <i className="fas fa-store"></i>
            </Link>
            {isAuthenticated && (
              <Link to="/wishlist" className="action-btn" title="Wishlist">
                <i className="fas fa-heart"></i>
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/notifications" className="action-btn" title="Notifications">
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="cart-badge">{unreadCount}</span>}
              </Link>
            )}
            <Link to="/cart" className="action-btn cart-btn" title="Cart">
              <i className="fas fa-shopping-cart"></i>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>

            <div className="account-menu">
              <button className="action-btn" title="Account" onClick={() => setAccountOpen((o) => !o)}>
                <i className="fas fa-user"></i>
              </button>
              {accountOpen && (
                <>
                  <div className="account-menu-backdrop" onClick={() => setAccountOpen(false)} />
                  <div className="account-dropdown">
                    {isAuthenticated ? (
                      <>
                        <div className="account-dropdown-greeting">Hi, {user.name?.split(' ')[0]}</div>
                        <Link to="/account" onClick={() => setAccountOpen(false)}>My Account</Link>
                        <Link to="/orders" onClick={() => setAccountOpen(false)}>My Orders</Link>
                        <Link to="/notifications" onClick={() => setAccountOpen(false)}>Notifications</Link>
                        <Link to="/wishlist" onClick={() => setAccountOpen(false)}>Wishlist</Link>
                        <button onClick={handleLogout}>Log Out</button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setAccountOpen(false)}>Log In</Link>
                        <Link to="/register" onClick={() => setAccountOpen(false)}>Create Account</Link>
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
                <Link to={link.path} onClick={() => setMenuOpen(false)}>{link.label}</Link>
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
