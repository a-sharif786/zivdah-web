import { Link } from 'react-router-dom'
import './About.css'

const stats = [
  { icon: 'fas fa-users', value: '50,000+', label: 'Happy Customers' },
  { icon: 'fas fa-box', value: '10,000+', label: 'Products' },
  { icon: 'fas fa-city', value: '25+', label: 'Cities Served' },
  { icon: 'fas fa-star', value: '4.8/5', label: 'Average Rating' },
]

const team = [
  { name: 'Arjun Mehta', role: 'CEO & Co-Founder', emoji: '👨‍💼' },
  { name: 'Priya Singh', role: 'Head of Operations', emoji: '👩‍💼' },
  { name: 'Ravi Kumar', role: 'Head of Technology', emoji: '👨‍💻' },
  { name: 'Anita Sharma', role: 'Head of Quality', emoji: '👩‍🔬' },
]

const values = [
  { icon: 'fas fa-leaf', title: 'Fresh Always', text: 'We source directly from farms to ensure maximum freshness for every product.' },
  { icon: 'fas fa-hand-holding-heart', title: 'Customer First', text: 'Your satisfaction is our top priority — from order to delivery.' },
  { icon: 'fas fa-recycle', title: 'Sustainability', text: 'Eco-friendly packaging and responsible sourcing for a greener tomorrow.' },
  { icon: 'fas fa-shield-alt', title: 'Quality Assured', text: 'Every product goes through rigorous quality checks before reaching you.' },
]

export default function About() {
  return (
    <div className="about-page">
      {/* HERO */}
      <section className="about-hero">
        <div className="container about-hero-inner">
          <h1>About Zivdah</h1>
          <p>Bringing fresh groceries from farm to your table since 2020</p>
          <div className="about-hero-actions">
            <Link to="/shop" className="btn-primary">Shop Now</Link>
            <Link to="/contact" className="btn-secondary">Contact Us</Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="about-stats">
        <div className="container stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="about-stat-card">
              <i className={s.icon}></i>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section className="section">
        <div className="container story-layout">
          <div className="story-img">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=500&fit=crop"
              alt="Our Story"
            />
          </div>
          <div className="story-text">
            <span className="story-label">Our Story</span>
            <h2>From a Small Idea to a Big Community</h2>
            <p>
              Zivdah was born out of a simple frustration — why is it so hard to get fresh, quality groceries
              delivered quickly? In 2020, our founders set out to solve this problem by building a platform
              that connects local farms and suppliers directly with households.
            </p>
            <p>
              Today, we serve over 50,000 families across 25 cities, delivering fresh produce, dairy, meat,
              and more — right to their doorstep within hours. We believe everyone deserves access to fresh,
              affordable food without the hassle.
            </p>
            <Link to="/shop" className="btn-primary" style={{ marginTop: 24 }}>
              Explore Our Products
            </Link>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section about-values-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Our Core Values</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: 40 }}>
            What drives us every day
          </p>
          <div className="grid-4">
            {values.map((v, i) => (
              <div key={i} className="value-card">
                <div className="value-icon"><i className={v.icon}></i></div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Meet Our Team</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: 40 }}>
            The people behind Zivdah
          </p>
          <div className="grid-4">
            {team.map((member, i) => (
              <div key={i} className="team-card">
                <div className="team-avatar">{member.emoji}</div>
                <h4>{member.name}</h4>
                <span>{member.role}</span>
                <div className="team-socials">
                  <a href="#"><i className="fab fa-linkedin"></i></a>
                  <a href="#"><i className="fab fa-twitter"></i></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container about-cta-inner">
          <h2>Ready to Experience Fresh Groceries?</h2>
          <p>Join 50,000+ happy customers who trust Zivdah for their daily grocery needs.</p>
          <Link to="/shop" className="btn-primary">Start Shopping <i className="fas fa-arrow-right"></i></Link>
        </div>
      </section>
    </div>
  )
}
