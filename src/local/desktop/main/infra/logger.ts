import { app } from 'electron'
import path from 'path'
import winston from 'winston'

// level { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
// default level is info, all the log with same or less level will be logged at transports

export const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
      filename: path.join(app.getPath('userData'), 'log.txt'),
      format: winston.format.printf(
        ({ level, source, message, ...meta }) => `${level} [${source}]: ${message} ${JSON.stringify(meta)}`
      )
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format((info) => ({ ...info }))(),
        winston.format.colorize({ level: true }),
        winston.format.printf(
          ({ source, level, message, ...meta }) => `${level} [${source}]: ${message} ${JSON.stringify(meta)}`
        )
      ),
      stderrLevels: ['info', 'error', 'warn', 'verbose', 'debug', 'silly']
    })
  )
}
