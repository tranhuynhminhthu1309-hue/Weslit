import { useEffect, useState } from 'react'

// Router hash tối giản: #/ , #/g/<groupId> , #/g/<groupId>/e/<eventId>
export function parseHash(h = window.location.hash) {
  const parts = h.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'g' && parts[1]) {
    if (parts[2] === 'e' && parts[3]) return { name: 'event', gid: parts[1], eid: parts[3] }
    return { name: 'group', gid: parts[1] }
  }
  return { name: 'home' }
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash())
  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const go = (path) => {
  window.location.hash = path
}
