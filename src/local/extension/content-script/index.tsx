import { ConsoleLog, ContentScriptLoaded } from 'lib/event/sementic'
import { assertRedirection } from 'lib/util/dom/common'
import { getEvHandler, initContentEvHandler } from './event/entity/content-event-handler'
import { createContainer } from './functions/app'

// if (process.env.NODE_ENV === 'production') console.log = function () {}
console.log('gatsby content-script executed')
// @ts-ignore
// console.log('context test : ', window?.g_mobileWebLink)

/**
 * the time when this script is loaded
 * It's already after that load event is fired
 */
createContainer()
initContentEvHandler()
  .then(function () {
    const evHandler = getEvHandler()
    return evHandler.sendEvent<ContentScriptLoaded, 'MAIN_WORLD'>({
      name: 'CONTENT_SCRIPT_LOADED',
      meta: { receiver: { component: 'MAIN_WORLD', id: 0 } }
    })
  })
  .then(assertRedirection)
  .then(function () {
    console.log('document loaded, sending report to background')

    const evHandler = getEvHandler()
    return Promise.all([
      evHandler.sendEvent<ContentScriptLoaded, 'BACKGROUND'>({
        name: 'CONTENT_SCRIPT_LOADED',
        meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
      })
    ])
  })
  // consider this later
  // .then(function () {
  //   const evHandler = getEvHandler()

  //   window.consume = (args) =>
  //     evHandler.sendEvent<Consume>({
  //       name: 'CONSUME',
  //       payload: args,
  //       meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
  //     })
  // })
  .catch(function () {
    const evHandler = getEvHandler()
    evHandler.sendEvent<ConsoleLog>({
      name: 'CONSOLE_LOG',
      payload: [`unloading : ${document.location.href}`],
      meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
    })
  })

// mountApp()
