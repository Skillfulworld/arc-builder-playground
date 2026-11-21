import { useCallback, useEffect, useState } from 'react'

export type Section = 'swap' | 'guestbook'

const fromPath = (path: string): Section => (path.startsWith('/guestbook') ? 'guestbook' : 'swap')

/** Minimal path router for the two dashboard sections. Paths: /swap and /guestbook. */
export function useSection() {
  const [section, setSection] = useState<Section>(() => fromPath(window.location.pathname))

  useEffect(() => {
    const onPop = () => setSection(fromPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: Section) => {
    window.history.pushState(null, '', `/${next}`)
    setSection(next)
    window.scrollTo({ top: 0 })
  }, [])

  return { section, navigate }
}
