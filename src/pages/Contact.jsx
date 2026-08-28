import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Contact.css'

const info = [
  { icon: 'fas fa-map-marker-alt', title: 'Our Address', lines: ['Unit 305, Kuber Complex,','New Link Road, Opp to Laxmi Industrial Estate', ' Andheri West, Mumbai-400053', 'India'] },
  { icon: 'fas fa-phone-alt', title: 'Phone Numbers', lines: ['(022) 44830442'] },
  { icon: 'fas fa-envelope', title: 'Email Us', lines: ['contact@zivdahonlinegrocery.com'] },
  { icon: 'fas fa-clock', title: 'Working Hours', lines: ['Mon – Sat: 8:00 AM – 9:00 PM', 'Sunday: 9:00 AM – 6:00 PM'] },
]

const faqs = [
  { q: 'How long does delivery take?', a: 'We deliver within 2–4 hours for orders placed before 6 PM. Same-day delivery is available in select areas.' },
  { q: 'What is the minimum order value?', a: 'There is no minimum order value. However, orders above ₹500 qualify for free delivery.' },
  { q: 'Can I cancel or modify my order?', a: 'Yes, you can cancel or modify your order within 30 minutes of placing it by contacting our support team.' },
  { q: 'Are the products fresh?', a: 'Absolutely! We source directly from farms and trusted suppliers, ensuring maximum freshness for every order.' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = e => {
    e.preventDefault()
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="contact-page">
      {/* HERO */}
      <section className="contact-hero">
        <div className="container">
          <h1>Get in Touch</h1>
          <p>We'd love to hear from you. Reach out for any questions, feedback, or support.</p>
        </div>
      </section>

      {/* INFO CARDS */}
      <section className="section">
        <div className="container">
          <div className="grid-4">
            {info.map((item, i) => (
              <div key={i} className="info-card">
                <div className="info-icon"><i className={item.icon}></i></div>
                <h4>{item.title}</h4>
                {item.lines.map((line, j) => <p key={j}>{line}</p>)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + MAP */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container contact-layout">
          <div className="contact-form-wrap">
            <h2>Send Us a Message</h2>
            <p className="contact-sub">Fill out the form and our team will get back to you within 24 hours.</p>

            {sent ? (
              <div className="success-msg">
                <i className="fas fa-check-circle"></i>
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us. We'll get back to you shortly.</p>
                <button className="btn-primary" onClick={() => setSent(false)}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Rahul Sharma" required />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="rahul@email.com" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <input name="subject" value={form.subject} onChange={handleChange} placeholder="Order issue / Feedback / General enquiry" required />
                </div>
                <div className="form-group">
                  <label>Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Write your message here..." required />
                </div>
                <button type="submit" className="btn-primary contact-submit">
                  Send Message <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            )}
          </div>

          <div className="map-wrap">
            <div className="map-embed">
              <iframe
                title="Zivdah Office Location"
                src="https://maps.google.com/maps?q=Unit%20305%2C%20Kuber%20Complex%2C%20New%20Link%20Road%2C%20Opp%20to%20Laxmi%20Industrial%20Estate%2C%20Andheri%20West%2C%20Mumbai-400053&output=embed"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <div className="social-contact">
              <h4>Connect With Us</h4>
              <div className="social-row">
                {[
                  { icon: 'fab fa-facebook-f', label: 'Facebook', color: '#1877f2' },
                  { icon: 'fab fa-instagram', label: 'Instagram', color: '#e4405f' },
                  { icon: 'fab fa-whatsapp', label: 'WhatsApp', color: '#25d366' },
                  { icon: 'fab fa-twitter', label: 'Twitter', color: '#1da1f2' },
                ].map((s, i) => (
                  <a key={i} href="#" className="social-contact-btn" style={{ '--sc': s.color }}>
                    <i className={s.icon}></i>
                    <span>{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Frequently Asked Questions</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: 40 }}>Quick answers to common questions</p>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary>{faq.q}<i className="fas fa-chevron-down"></i></summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
