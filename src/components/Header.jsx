import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_META, CATEGORY_VALUES } from '../utils/categoryMeta'
import './Header.css'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/shop' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
]

export default function Header() {
  const { count } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const navigate = useNavigate()

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
          <span><i className="fas fa-phone-alt"></i> +91 98765 43210</span>
          <span><i className="fas fa-envelope"></i> support@zivdah.com</span>
          <span><i className="fas fa-truck"></i> Free delivery on orders over ₹500</span>
        </div>
      </div>

      <div className="header-main">
        <div className="container header-main-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">🛒</span>
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
            <Link to="/shop" className="action-btn" title="Shop">
              <i className="fas fa-store"></i>
            </Link>
            {isAuthenticated && (
              <Link to="/wishlist" className="action-btn" title="Wishlist">
                <i className="fas fa-heart"></i>
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
            {CATEGORY_VALUES.map((cat) => (
              <Link key={cat} to={`/shop/${cat}`} onClick={() => setMenuOpen(false)}>
                {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
