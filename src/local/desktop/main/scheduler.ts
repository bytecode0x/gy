import schedule from 'node-schedule'
import { RRule } from 'rrule'
import { logger } from './infra/logger'

export type Calendar = Record<string, { job: schedule.Job; date: Date }>

const calendar: Calendar = {}

export function getCalendar() {
  return calendar
}

export function cancelJob(key: string) {
  delete calendar[key]
}

export function getJob(key: string) {
  return calendar[key]
}

export function occurr({
  key,
  name,
  point,
  rrule,
  onRun,
  onTime
}: {
  key: string
  name: string
  rrule: RRule
  point: Date
  onTime: CallableFunction
  onRun: CallableFunction
}) {
  logger.info(`job with key ${key} is being scheduled`, { source: 'scheduler' })

  if (calendar[key]) return logger.info(`job with key ${key} is already scheduled`, { source: 'scheduler' })

  let next: Date | null = point

  do {
    next = rrule.after(next)

    if (!next)
      return logger.info(`job with key ${key} is not scheduled since the rrule expired`, {
        source: 'scheduler'
      })
  } while (next.getTime() < Date.now())

  const job = schedule.scheduleJob(name, next, async function () {
    await new Promise<any>(function (resolve) {
      resolve(onTime())
    }).finally(function () {
      logger.info(`job with key ${key} is finished`, { source: 'scheduler' })
      if (calendar[key].job === job) {
        logger.info(`deleting the job from calendar with key ${key}`, { source: 'scheduler' })
        delete calendar[key]
      }
      occurr({ name, key, rrule, point: next, onTime, onRun })
    })
  })

  calendar[key] = { job, date: next }
  logger.info('job is scheduled', {
    source: 'scheduler',
    key,
    job: calendar[key].job.name,
    date: next,
    calendar: Object.entries(getCalendar()).map(([key, { job }]) => [key, job.name])
  })

  job.once('run', function () {
    onRun()
  })
}
