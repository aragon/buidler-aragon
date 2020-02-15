import { logMain } from './logger'

export const BACKEND_BUILD_STARTED = 'EVENT_BACKEND_BUILD_STARTED'
export const BACKEND_PROXY_UPDATED = 'EVENT_BACKEND_PROXY_UPDATED'
export const FRONTEND_STARTED_SERVING = 'EVENT_FRONTEND_STARTED_SERVING '

export function emitEvent(eventName: string, delay = 0): void {
  setTimeout(() => {
    logMain(eventName)
  }, delay)
}
