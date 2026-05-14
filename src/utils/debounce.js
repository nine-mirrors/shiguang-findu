export function debounce(fn, delay = 300) {
  let timer = null

  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

export function throttle(fn, delay = 300) {
  let lastTime = 0
  let timer = null

  return function (...args) {
    const now = Date.now()

    if (now - lastTime < delay) {
      if (timer) clearTimeout(timer)

      timer = setTimeout(() => {
        lastTime = Date.now()
        fn.apply(this, args)
      }, delay)
    } else {
      lastTime = now
      fn.apply(this, args)
    }
  }
}
