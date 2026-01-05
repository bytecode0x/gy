import Rectangle from 'lib/asset/svg/Rectangle'
import { EvaluateSubstitute } from 'lib/event/sementic'
import { FlexCenterDiv, FlexColumnDiv, FlexDiv, Span, TextArea, TextButton } from 'lib/frame/generic'
import { DataRecord } from 'lib/gy/core/type/primitive'
import { SCROLL } from 'lib/styled-css-property'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { FC, useEffect, useRef, useState } from 'react'

import styled from 'styled-components'

const Container = styled(FlexColumnDiv)`
  border-radius: var(--border-radius-default, 8px);
  background-color: white;
  padding: var(--padding-default, 8px);
  box-shadow: var(--shadow-elevation4);
  min-width: 0;
  width: 600px;
  height: 450px;
`

const EvaluatedLayout = styled(FlexColumnDiv)`
  flex: 1;
  align-items: stretch;
  padding: 4px;

  border: 1px solid var(--color-border-base);
  overflow: scroll;
  ${SCROLL}

  & > pre {
    text-wrap: pretty;
    word-break: break-all;
  }
`

const Evaluated = styled.pre`
  font-size: 12px;
`

const StatusLayout = styled(FlexCenterDiv)`
  justify-content: space-between;
  margin: 6px 4px;
`

const InputLayer = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;
`

const SubstitutesContainer = styled(FlexColumnDiv)`
  // width: 200px;
  align-items: stretch;
  min-height: 0;
  min-width: 0;

  flex: 1;
  overflow: scroll;
  // ${SCROLL}
  padding: 0 4px;
  font-size: 12px;

  ::-webkit-scrollbar {
    width: 0;
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }
`

const ModeSVGContainer = styled(FlexCenterDiv)`
  position: relative;
  & > svg {
    width: 20px;
    height: 20px;
  }
`

const ButtonsContainer = styled(FlexCenterDiv)`
  font-size: 12px;

  & > button:first-of-type {
    margin-right: 4px;
  }

  & button {
    border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
    padding: 6px;
    margin-right: 4px;
    box-shadow: var(--shadow-elevation);
  }
`

const TemplateLayer = styled(FlexColumnDiv)`
  width: 200px;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
  margin-left: 6px;
  border: 1px solid var(--color-border-base);
`
const TemplateHeader = styled(Span)`
  font-size: 14px;
  text-align: center;
  padding: 6px;
  font-weight: bold;
`

const Status = styled(Span)<{ validated?: boolean }>`
  background-color: ${({ validated }) => (validated === undefined ? 'grey' : validated ? 'green' : 'red')};
  position: relative;
  font-size: 12px;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  margin-right: 4px;
`

/**
 * todo
 * 1. implement evaluation
 * 2. implement command order(separation-evaluation, evaluation-separation)
 */

type StringInputProps = {
  initial?: string
  snapshot: DataRecord
  placeholder?: string
  onResolve: (raw: string, evaluated: string) => void
  onReject: (reason?: any) => void
}

const StringInput: FC<StringInputProps> = ({ placeholder, initial, snapshot, onResolve, onReject }) => {
  const [raw, setRaw] = useState<string>(initial || '')
  const [evaluated, setEvaluated] = useState<string>('')
  //   const [mode, setMode] = useState<'separate-first' | 'substitute-first'>('substitute-first')
  const [autocomplete, setAutocomplete] = useState<boolean>(false)
  const [validated, setValidated] = useState<boolean | undefined>(undefined)

  // if you try to find ps inside function body It will costs more
  // spreading is applied on snapshots

  const substitutes = useRef(Object.keys(snapshot)).current

  const pSubstitution = useRef(
    /(?<!\\)\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*|\d+))\])*(?:\((?<separators>.+)\))*(?<!\\)\}/
  ).current

  const pMatrixSubstitution = useRef(
    /^\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*|\d+))\])*(?:\((?<separators>.+)\))*(?<!\\)\}$/
  ).current

  const pSerializedSubstitution = useRef(
    /"\$\{(?<substitute>[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*)(?:\[(?<index>(?:[a-zA-Z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][0-9a-zA-Z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*|\d+))\])*(?:\((?<separators>.+)\))*(?<!\\)\}"/
  ).current

  useEffect(
    function evaluate() {
      if (!raw) {
        setEvaluated('')
        setValidated(undefined)
        return
      }

      if (!pSerializedSubstitution.test(raw)) {
        setValidated(true)
        setEvaluated(raw)
        return
      }

      const clear = window.setTimeout(function () {
        if (process.env.NODE_ENV !== 'devserver') {
          const evhandler = getEvHandler()
          evhandler
            .sendEvent<EvaluateSubstitute>({
              name: 'EVALUATE_SUBSTITUTE',
              payload: { expression: raw, sdr: snapshot },
              meta: { receiver: { alias: 'MAIN', component: 'MAIN' } }
            })
            .then((string) => {
              setValidated(true)
              setEvaluated(string)
            })
        } else {
          const substitute = pSerializedSubstitution.exec(raw)?.groups?.substitute

          if (!substitute) return console.log('no substitute')
          setValidated(true)
          setEvaluated(
            raw.replace(new RegExp(pSerializedSubstitution, 'g'), function (match, p1, p2, p3) {
              return snapshot[p1]?.map((row) => row.join(', ')).join('\n') || match
            })
          )
        }
      }, 1000)

      return function clearPooling() {
        window.clearTimeout(clear)
      }
    },
    [raw]
  )
  /**
   * todo :
   * input ", { in pair and relocate carrot
   */

  return (
    <Container>
      <InputLayer>
        <TextArea
          // eslint-disable-next-line no-template-curly-in-string
          placeholder={placeholder || '예시1)가나다\n예시2)"${Substitute1}"'}
          value={raw}
          rows={6}
          css={{ flex: 1, border: '1px solid var(--color-border-base)' }}
          onChange={function (e) {
            setRaw(`${e.target.value}`)
          }}
          required
          autoFocus
        />
        <TemplateLayer>
          <SubstitutesContainer>
            <TemplateHeader>Substitutes</TemplateHeader>
            {substitutes.map((substitute) => (
              <TextButton
                type='button'
                key={substitute}
                onClick={function (e) {
                  setRaw((prev) => `${prev}"\${${substitute}}"`)
                }}
              >
                <Span>{substitute}</Span>
              </TextButton>
            ))}
          </SubstitutesContainer>
        </TemplateLayer>
      </InputLayer>

      <StatusLayout>
        <ButtonsContainer>
          <TextButton
            type='button'
            disabled={!raw || !validated}
            onClick={function (e) {
              onResolve(raw, evaluated)
            }}
          >
            <Span>확인</Span>
          </TextButton>
          <TextButton
            type='button'
            onClick={function (e) {
              onReject('user canceled')
            }}
          >
            <Span>취소</Span>
          </TextButton>
        </ButtonsContainer>
        <FlexCenterDiv>
          <Status validated={validated} data-desc={validated ? '정상적인 형식입니다' : '비정상적인 형식입니다'} />

          <ModeSVGContainer>
            <Rectangle />
          </ModeSVGContainer>
        </FlexCenterDiv>
      </StatusLayout>
      <EvaluatedLayout>
        <Evaluated>{evaluated}</Evaluated>
      </EvaluatedLayout>
    </Container>
  )
}

export default StringInput
