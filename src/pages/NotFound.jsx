import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container empty-state" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <i className="fas fa-map-signs"></i>
      <h3>404 — Page Not Found</h3>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
        <i className="fas fa-home"></i> Back to Home
      </Link>
    </div>
  )
}
