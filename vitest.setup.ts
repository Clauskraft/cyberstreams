import { afterEach, vi } from 'vitest'

if (!global.fetch) {
  global.fetch = vi.fn()
}

afterEach(() => {
  vi.restoreAllMocks()
})
