window.eh.sendEvent({
  name: 'PIPE',
  payload: {
    name: 'EVAL',
    payload: {
      code,
      params: [
        {
          id: 'prxy',
          // value: session?.process.pd.config.dynamicImportDr ? edr : {}
          value: {}
        }
      ],
      meta: { edrKey: '' }
    },
    meta: { receiver: { component: 'MAIN_WORLD', id: 0 } }
  },
  meta: { receiver: { component: 'CONTENT_SCRIPT', id: tabId } }
})



window.eh.sendEvent({
    name: 'QUERY_TABS',
    payload: {
      url: ''
    },
    meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
})
