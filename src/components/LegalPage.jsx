import { Link } from 'react-router-dom'
import './LegalPage.css'

export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="container">
          <h1>{title}</h1>
          {updated && <p className="legal-updated">Last updated: {updated}</p>}
        </div>
      </section>

      <section className="section">
        <div className="container legal-content">
          {intro && <p className="legal-intro">{intro}</p>}

          {sections.map((s, i) => (
            <div key={i} className="legal-section">
              <h2>{s.heading}</h2>
              {s.paragraphs?.map((p, j) => <p key={j}>{p}</p>)}
              {s.list && (
                <ul className="legal-list">
                  {s.list.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}

          <div className="legal-section legal-contact-cta">
            <p>
              Have questions about this policy? <Link to="/contact">Contact our support team</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
