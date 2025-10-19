import pino from 'pino'

const level = process.env.LOG_LEVEL || 'info'

export const logger = pino({
  level,
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard'
        }
      },
  base: {
    service: process.env.SERVICE_NAME || 'cyberstreams'
  }
})

export function createChildLogger(bindings = {}) {
  return logger.child(bindings)
}
