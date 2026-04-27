export const EASE_EXPO   = [0.16, 1, 0.3, 1] as const
export const EASE_OUT    = [0.23, 1, 0.32, 1] as const
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const
export const EASE_SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: EASE_EXPO, delay },
})

export const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: EASE_OUT, delay },
})

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: EASE_EXPO },
}

export const slideInRight = {
  initial: { opacity: 0, x: '100%' },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: '100%' },
  transition: { duration: 0.38, ease: EASE_DRAWER },
}

export const staggerList = {
  animate: { transition: { staggerChildren: 0.035 } },
}

export const listContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.035 } },
}

export const listItem = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_EXPO } },
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: EASE_EXPO },
}
