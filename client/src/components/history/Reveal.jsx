import { useEffect, useRef, useState } from 'react'

// Restrained fade-and-rise as content scrolls into view. Content is visible
// by default and stays so when IntersectionObserver is missing or the visitor
// prefers reduced motion — the animation can never hide the history.
export default function Reveal({ as: Tag = 'div', className = '', children }) {
  const ref = useRef(null)
  const [hidden, setHidden] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!node || reduce || typeof IntersectionObserver === 'undefined') return undefined
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight) return undefined // already on screen: no animation
    setHidden(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const state = hidden && !shown ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
  return (
    <Tag ref={ref} className={`transition duration-700 ease-out motion-reduce:transition-none ${state} ${className}`}>
      {children}
    </Tag>
  )
}
