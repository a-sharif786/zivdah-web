import { useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'
import { formatDateTime } from '../utils/format'
import './Notifications.css'

export default function Notifications() {
  const { notifications, loading, markSeen } = useNotifications()

  // Mark everything seen the moment the page is actually viewed, not just when the bell is
  // clicked — clears the header badge for whatever's visible here.
  useEffect(() => {
    markSeen()
  }, [markSeen])

  return (
    <div className="container notifications-page">
      <h1 className="section-title">My Notifications</h1>

      {loading && notifications.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-spinner fa-spin"></i>
          <h3>Loading notifications...</h3>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-bell"></i>
          <h3>No notifications yet</h3>
          <p>Updates about your orders will show up here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div key={n.id} className="notification-card">
              <div className="notification-icon">
                <i className="fas fa-bell"></i>
              </div>
              <div className="notification-body">
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <span className="notification-date">{formatDateTime(n.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
