/** @type { Array<{ type: 'numbering', parameters: { title: Array<string>; phrases: Array<string> } } | { type: 'procedural', parameters: { title: Array<string>; steps: Array<string> } } | { type: 'subject', parameters: { title: Array<string>; subjects: Array<string>; descriptions: Array<string> } }> } */
const panels = JSON.parse(
  `[{"type":"numbering","parameters":{"title":["Special care ", "For your skin"],"phrases":["스킨케어 제품의 유효성분 흡수케어로 제대로 관리가 필요한 피부","피부샵 관리의 필요성을 느끼나 집에서 간편히 케어하고 싶은 피부","피부 개선의 필요성은 느끼나 비용과 단계의 부담으로 케어를 못하고 있는 피부","다양한 스킨케어 제품 사용에도 변화가 없는 피부","매끈하고 건강하게 돌아가고 싶은 피부"]}},{"type":"procedural","parameters":{"title":["Riddleshot boosting ampoule", "GUIDE"],"steps":["세안 후 첫 단계에서 사용하는 스킨케어 부스터 제품으로 깨끗하게 세안된 맨 얼굴에 적당량을 덜어 발라주세요","마사지하듯 롤링하며 흡수시킨 후 마무리 단계에서 손바닥으로 전체적으로 꾹꾹 눌러주며 마무리 해주세요","개인차에 따라 양과 사용주기를 조절해 주시고 사용 후에는 충분한 보습 케어 및 외출 시에는 선 케어를 꼭 해주세요"]}},{"type":"subject","parameters":{"title":["Q&A"],"subjects":["사용시 따끔해요! 어떻게 써야 하나요?","민감한 피부에도 사용 가능한가요?","리들샷과 함께 사용하면 안되는 성분이 있나요?"],"descriptions":["리들샷 사용시 따끔함은 개인의 피부 타입 및 민감도에 따라 다를 수 있습니다 따끔함이 느껴지신다면 주기적으로 피부에 따라 양과 사용 주기 조절을 권장합니다","리들샷 페이셜 부스팅 퍼스트 앰플은 피부 자극 테스트를 완료했습니다 피부에 따라 국소 부위 사전 테스트 및 충분한 보습 케어를 해주면 효과적인 관리가 가능하며 강한 열과 자외선은 피할 것을 권장합니다","리들샷과 함께 사용하면 안되는 성분은 없습니다 다만 피부 민감도 관련 사용주의가 안내된 성분의 경우 사전 테스트 후에 양과 주기를 조절하여 사용해주세요"]}}]`
)
const tabId = neo.stringify(edward.topDownSearch({ key: 'EXTENSION_TAB', tree }))

await log('panels: ', panels)

const translate = importPlugin('translate')
const sharp = importPlugin('sharp')

const translated_panels2 = []

for (const panel of panels) {
  switch (panel.type) {
    case 'numbering': {
      translated_panels2.push({
        ...panel,
        parameters: {
          ...panel.parameters,
          phrases: (await translate({ text: panel.parameters.phrases.join('\n'), source: 'ko', target: 'en' })).split(
            '\n'
          )
        }
      })
      break
    }

    case 'procedural': {
      translated_panels2.push({
        ...panel,
        parameters: {
          ...panel.parameters,
          steps: (await translate({ text: panel.parameters.steps.join('\n'), source: 'ko', target: 'en' })).split('\n')
        }
      })
      break
    }

    case 'subject': {
      translated_panels2.push({
        ...panel,
        parameters: {
          ...panel.parameters,
          subjects: (await translate({ text: panel.parameters.subjects.join('\n'), source: 'ko', target: 'en' })).split(
            '\n'
          ),
          descriptions: (
            await translate({ text: panel.parameters.descriptions.join('\n'), source: 'ko', target: 'en' })
          ).split('\n')
        }
      })
      break
    }

    default: {
      throw new Error('INVALID_PANEL_TYPE')
    }
  }
}

await log('test: ', translated_panels2)

const { translated_panels } = await consume({
  /** @type { import('lib/gy/core/type/action').Action<import('local/desktop/main/gy/type/action.preset').__Action__Define> } */
  $action: {
    template: 'DEFINE',
    id: '',
    name: 'translated_panels',
    schema: '',
    state: 'WATING',
    value: {
      title: 'Confirm translation on panel data',
      record: {
        translated_panels: `$<json|parse|${JSON.stringify(
          await Promise.all(
            panels.map(async function (panel) {
              switch (panel.type) {
                case 'numbering': {
                  return {
                    ...panel,
                    parameters: {
                      ...panel.parameters,
                      phrases: (
                        await translate({ text: panel.parameters.phrases.join('\n'), source: 'ko', target: 'en' })
                      ).split('\n')
                    }
                  }
                }

                case 'procedural': {
                  return {
                    ...panel,
                    parameters: {
                      ...panel.parameters,
                      steps: (
                        await translate({ text: panel.parameters.steps.join('\n'), source: 'ko', target: 'en' })
                      ).split('\n')
                    }
                  }
                }

                case 'subject': {
                  return {
                    ...panel,
                    parameters: {
                      ...panel.parameters,
                      subjects: (
                        await translate({ text: panel.parameters.subjects.join('\n'), source: 'ko', target: 'en' })
                      ).split('\n'),
                      descriptions: (
                        await translate({ text: panel.parameters.descriptions.join('\n'), source: 'ko', target: 'en' })
                      ).split('\n')
                    }
                  }
                }

                default: {
                  throw new Error('INVALID_PANEL_TYPE')
                }
              }
            })
          )
        )}>`
      },
      confirm: true
    }
  }
})

for (const [i, p] of translated_panels.entries()) {
  const { tidOrTree: image_tree } = await initiateProcedure({
    pid: '1ea278de-aa65-4fa1-9cd8-126645b404b9',
    returnType: 'tree',
    idr: {
      panel_type: [[p.type]],
      attach: [[`$<json|parse|${tabId}>`]],
      panel_params: neo.toMatrix(p.parameters),
      confirm: [['$<json|parse|false>']]
    },
    config: {
      invokeEffectImmediately: false,
      preserveTree: false,
      silenced: true
    }
  })

  const base64_string = neo.stringify(edward.topDownSearch({ key: 'base64_string', tree: image_tree }))

  const file = `${id}_panels${i}.jpg`

  await sharp(Buffer.from(base64_string.slice('data:image/png;base64,'.length), 'base64'))
    .jpeg()
    .toFile(path.join(dir, file))
}
