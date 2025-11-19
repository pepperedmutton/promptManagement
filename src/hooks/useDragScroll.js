import { useEffect } from 'react'

const EDGE_THRESHOLD = 160
const MIN_STEP = 4
const EXTRA_STEP = 12
const MAX_OVERSHOOT_MULTIPLIER = 3

const getProximityFactor = (distanceToEdge) => {
  if (distanceToEdge > EDGE_THRESHOLD) return 0
  const normalized = (EDGE_THRESHOLD - Math.max(distanceToEdge, 0)) / EDGE_THRESHOLD
  if (normalized <= 0) return 0
  return Math.pow(normalized, 1.5)
}

const getOvershootMultiplier = (distanceToEdge) => {
  if (distanceToEdge >= 0) return 1
  const overshootRatio = Math.min(MAX_OVERSHOOT_MULTIPLIER - 1, Math.abs(distanceToEdge) / EDGE_THRESHOLD)
  return 1 + overshootRatio
}

export function useDragScroll(isDragging) {
  useEffect(() => {
    if (!isDragging) return

    const handleWheelWhileDragging = (event) => {
      event.preventDefault()
      window.scrollBy({
        top: event.deltaY,
        behavior: 'auto'
      })
    }

    let edgeScrollFrame = null

    const handleEdgeScroll = (event) => {
      const { clientY } = event
      if (typeof clientY !== 'number') return

      const distanceFromBottom = window.innerHeight - clientY
      let delta = 0

      if (clientY < EDGE_THRESHOLD) {
        const proximity = getProximityFactor(clientY)
        if (proximity > 0 || clientY < 0) {
          const multiplier = getOvershootMultiplier(clientY)
          const speedFactor = proximity * multiplier
          delta = -(MIN_STEP + EXTRA_STEP * speedFactor)
        }
      }

      if (delta === 0 && distanceFromBottom < EDGE_THRESHOLD) {
        const proximity = getProximityFactor(distanceFromBottom)
        if (proximity > 0 || distanceFromBottom < 0) {
          const multiplier = getOvershootMultiplier(distanceFromBottom)
          const speedFactor = proximity * multiplier
          delta = MIN_STEP + EXTRA_STEP * speedFactor
        }
      }

      if (delta === 0) return

      event.preventDefault()
      if (edgeScrollFrame) return

      edgeScrollFrame = window.requestAnimationFrame(() => {
        window.scrollBy({
          top: delta,
          behavior: 'auto'
        })
        edgeScrollFrame = null
      })
    }

    const listenerOptions = { passive: false }

    window.addEventListener('wheel', handleWheelWhileDragging, listenerOptions)
    window.addEventListener('dragover', handleEdgeScroll, listenerOptions)

    return () => {
      if (edgeScrollFrame) {
        window.cancelAnimationFrame(edgeScrollFrame)
        edgeScrollFrame = null
      }
      window.removeEventListener('wheel', handleWheelWhileDragging, listenerOptions)
      window.removeEventListener('dragover', handleEdgeScroll, listenerOptions)
    }
  }, [isDragging])
}
