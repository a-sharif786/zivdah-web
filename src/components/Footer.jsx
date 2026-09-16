import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CATEGORY_META, CATEGORY_VALUES } from '../utils/categoryMeta'
import './Footer.css'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span>🛒</span>
              <div>
                <div className="footer-logo-name">Zivdah</div>
                <div className="footer-logo-sub">{t('footer.tagline')}</div>
              </div>
            </div>
            <p>{t('footer.description')}</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-youtube"></i></a>
              <a href="#"><i className="fab fa-whatsapp"></i></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t('footer.quickLinks')}</h4>
            <ul>
              <li><Link to="/">{t('footer.home')}</Link></li>
              <li><Link to="/shop">{t('footer.shop')}</Link></li>
              <li><Link to="/about">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/contact">{t('footer.contact')}</Link></li>
              <li><Link to="/cart">{t('footer.myCart')}</Link></li>
              <li><Link to="/orders">{t('footer.myOrders')}</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.categories')}</h4>
            <ul>
              {CATEGORY_VALUES.map((cat) => (
                <li key={cat}><Link to={`/shop/${cat}`}>{CATEGORY_META[cat].label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.contactUs')}</h4>
            <ul className="contact-info">
              <li><i className="fas fa-map-marker-alt"></i> {t('footer.address')}</li>
              <li><i className="fas fa-phone-alt"></i> (022) 44830442</li>
              <li><i className="fas fa-envelope"></i> contact@zivdahonlinegrocery.com</li>
              <li><i className="fas fa-clock"></i> {t('footer.hours')}</li>
            </ul>
            <div className="app-badges">
              <a
                href="https://play.google.com/store/apps/details?id=com.zivdahonlinegrocery.business&hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="app-badge"
              >
                <i className="fab fa-google-play"></i>
                {t('footer.googlePlay')}
              </a>

              <a
                href="https://apps.apple.com/app/YOUR_APP_ID"
                target="_blank"
                rel="noopener noreferrer"
                className="app-badge"
              >
                <i className="fab fa-apple"></i>
                {t('footer.appStore')}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>{t('footer.copyright')}</p>
          <div className="payment-icons">
            <i className="fab fa-cc-visa"></i>
            <i className="fab fa-cc-mastercard"></i>
            <i className="fab fa-cc-paypal"></i>
            <i className="fab fa-google-pay"></i>
          </div>
        </div>
        <div className="container footer-policy-links">
          <Link to="/privacy-policy">{t('footer.privacyPolicy')}</Link>
          <Link to="/refund-policy">{t('footer.refundPolicy')}</Link>
          <Link to="/cancellation-policy">{t('footer.cancellationPolicy')}</Link>
        </div>
        <div className="container footer-legal">
          <span>CIN: U47912MH2025PTC437794</span>
          <span>GSTIN: 27AACCZ5397C1Z1</span>
          <span>FSSAI License Number: 11525997000838</span>
        </div>
      </div>
    </footer>
  )
}
