export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

let touchStartX = 0
let touchStartY = 0
let touchEndX = 0
let touchEndY = 0

export function handleSwipe(element, options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefault = false
  } = options

  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].clientX
    touchEndY = e.changedTouches[0].clientY

    const diffX = touchEndX - touchStartX
    const diffY = touchEndY - touchStartY

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      }
    } else {
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }
    }

    if (preventDefault) {
      e.preventDefault()
    }
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault })
  element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault })

  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchend', handleTouchEnd)
  }
}

export let lastTap = 0
export function handleDoubleTap(element, onDoubleTap, delay = 300) {
  const handleTap = (e) => {
    const now = Date.now()

    if (now - lastTap < delay) {
      onDoubleTap?.(e)
      lastTap = 0
    } else {
      lastTap = now
    }
  }

  element.addEventListener('touchend', handleTap, { passive: true })

  return () => {
    element.removeEventListener('touchend', handleTap)
  }
}

export function handleLongPress(element, onLongPress, delay = 500) {
  let pressTimer = null

  const handleStart = (e) => {
    pressTimer = setTimeout(() => {
      onLongPress?.(e)
    }, delay)
  }

  const handleEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      pressTimer = null
    }
  }

  element.addEventListener('touchstart', handleStart, { passive: true })
  element.addEventListener('touchend', handleEnd, { passive: true })
  element.addEventListener('touchmove', handleEnd, { passive: true })
  element.addEventListener('touchcancel', handleEnd, { passive: true })

  return () => {
    element.removeEventListener('touchstart', handleStart)
    element.removeEventListener('touchend', handleEnd)
    element.removeEventListener('touchmove', handleEnd)
    element.removeEventListener('touchcancel', handleEnd)
  }
}
