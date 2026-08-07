import { Link } from 'react-router-dom'
import { CATEGORY_META, CATEGORY_VALUES } from '../utils/categoryMeta'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span>🛒</span>
              <div>
                <div className="footer-logo-name">Zivdah</div>
                <div className="footer-logo-sub">Online Grocery</div>
              </div>
            </div>
            <p>Fresh groceries delivered to your doorstep. Shop from a wide range of quality products at the best prices.</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-youtube"></i></a>
              <a href="#"><i className="fab fa-whatsapp"></i></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Categories</h4>
            <ul>
              {CATEGORY_VALUES.map((cat) => (
                <li key={cat}><Link to={`/shop/${cat}`}>{CATEGORY_META[cat].label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact Us</h4>
            <ul className="contact-info">
              <li><i className="fas fa-map-marker-alt"></i> 123 Market Street, Mumbai, India</li>
              <li><i className="fas fa-phone-alt"></i> +91 98765 43210</li>
              <li><i className="fas fa-envelope"></i> support@zivdah.com</li>
              <li><i className="fas fa-clock"></i> Mon–Sat: 8AM – 9PM</li>
            </ul>
            <div className="app-badges">
              <div className="app-badge"><i className="fab fa-google-play"></i> Google Play</div>
              <div className="app-badge"><i className="fab fa-apple"></i> App Store</div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2025 Zivdah Online Grocery. All rights reserved.</p>
          <div className="payment-icons">
            <i className="fab fa-cc-visa"></i>
            <i className="fab fa-cc-mastercard"></i>
            <i className="fab fa-cc-paypal"></i>
            <i className="fab fa-google-pay"></i>
          </div>
        </div>
      </div>
    </footer>
  )
}
