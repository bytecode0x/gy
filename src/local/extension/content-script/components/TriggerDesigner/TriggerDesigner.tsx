import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import { Trigger } from 'lib/gy/core/type/trigger'
import { pushMessage } from 'lib/util/dom/render'
import { __Trigger__ContextButton, __Trigger__DateTime, TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'
import React from 'react'
import { v4 } from 'uuid'
import { z } from 'zod'
import { safeGetBody } from '../../functions/app'

type Props = {
  initial: {
    name?: string
    id?: string
    pid: string
    template: Trigger<TriggerPreset>['template']
    value?: Trigger<TriggerPreset>['value']
    on?: boolean
  }
  onResolve: (trigger: Trigger<TriggerPreset>) => any
  onReject: () => any
}

const TriggerDesigner: React.FunctionComponent<Props> = ({ initial, onReject, onResolve }) => {
  switch (initial.template) {
    case 'DATE_TIME': {
      const i = initial as Trigger<__Trigger__DateTime>

      return (
        <RawStringInput
          header='Serialized RRule Value'
          initial={{ $rrule: i.value?.$rrule || '', name: i.name || '' }}
          onReject={function () {
            onReject()
          }}
          onResolve={function ({ $rrule, name }) {
            console.log('$rrule: ', $rrule)

            const trigger: Trigger<__Trigger__DateTime> = {
              id: i.id || v4(),
              name: name || `datetime_${Date.now()}`,
              on: i.on || true,
              pid: i.pid,
              template: i.template,
              value: { $rrule }
            }

            onResolve(trigger)
          }}
          interpret={(raw) => Promise.resolve(raw)}
        />
      )
    }

    case 'CONTEXT_BUTTON': {
      const i = initial as Trigger<__Trigger__ContextButton>

      return (
        <Form
          header='값을 입력하세요'
          record={{
            '버튼 이름': {
              help: '버튼 이름을 입력하세요',
              data: i.value?.name,
              effect(getter, setter) {
                const name = window.prompt('버튼 이름을 입력해주세요')
                if (name) setter(name)
              },
              labeler(value) {
                return value
              }
            },
            'URL 패턴': {
              help: '버튼이 나타날 URL 패턴을 입력하세요',
              data: i.value?.documentUrlPatterns.join('\n') || `${window.location.origin}/*`,
              modal(getter, setter, close) {
                return (
                  <RawStringInput
                    header='Url patterns'
                    initial={{ url_patterns: getter() }}
                    onReject={function () {
                      close()
                    }}
                    onResolve={function ({ url_patterns }) {
                      setter(url_patterns || `${window.location.origin}/*`)
                      close()
                    }}
                  />
                )
              },
              labeler(value) {
                return value
              }
            }
          }}
          onReject={onReject}
          onResolve={function (formData) {
            const validator = z.object({
              name: z.string().nonempty(),
              documentUrlPatterns: z.array(z.string())
            })

            const parse = validator.safeParse({
              name: formData['버튼 이름'],
              documentUrlPatterns: formData['URL 패턴'].split('\n')
            })
            console.log('check')

            if ('error' in parse)
              return parse.error!.issues.forEach(({ path, message }) =>
                pushMessage({
                  message: `${path[0]} : 올바른 값이 아닙니다\n${message}`,
                  layer: safeGetBody().querySelector('#push')
                })
              )
            console.log('check2')

            i.name = formData['버튼 이름']
            i.value = {
              name: formData['버튼 이름'],
              documentUrlPatterns: formData['URL 패턴'].split('\n')
            }

            onResolve(i)
          }}
        />
      )
    }

    default:
      throw new Error('')
  }
}

export default TriggerDesigner
