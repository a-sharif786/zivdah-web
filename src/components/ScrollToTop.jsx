import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// react-router doesn't reset scroll position on navigation (unlike a classic
// multi-page site) — without this, clicking a link while scrolled down on the
// current page leaves the next page scrolled down too.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
