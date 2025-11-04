import Rectangle from 'lib/asset/svg/Rectangle'
import { FlexCenterDiv, FlexColumnDiv, FlexDiv, Span, TextArea, TextButton } from 'lib/frame/generic'
import { TextButtonsLayout1 } from 'lib/frame/sementic'
import { SCROLL } from 'lib/styled-css-property'
import { FC, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

/**
 * todo
 * this component should be able to render an element of this component in child as layering down
 * It shouldn't re-render itself when rendering children
 * which means you can't use state to render children as It invokes overhead
 * so you need renderer that renders children
 */

type RawStringInputProps = {
  initial?: Record<string, string>
  header: string
  disabled?: boolean
  configurable?: boolean
  interpret?: (
    $record: Record<string, string>,
    log: (value: string) => void
    // predicate: (flag: boolean) => void
  ) => Promise<Record<string, any>>
  // serialize?: (interpreted: InterpretedDataProperty) => Promise<string>
  onResolve: ($record: Record<string, string>, interpreted: Record<string, any>, validated: boolean) => void
  onReject: (reason?: any) => void
}

/**
 * this simulates substitution that resolves matrix
 * design value property : string
 * resolve : matrix
 *
 * todo;
 * decouple join, stringify
 */
const RawStringInput: FC<RawStringInputProps> = ({
  initial,
  header,
  disabled,
  configurable,
  interpret,
  // serialize,
  onResolve,
  onReject
}) => {
  const [$record, set$Record] = useState<Record<string, string>>({ ...initial })
  // const [currentKey, setCurrentKey] = useState<string>(Object.keys(initial || {}).at(0) || '')
  // const [input, setInput] = useState<string>(currentKey ? $record[currentKey] : '')
  const [record, setRecord] = useState<Record<string, any>>({})
  const [validated, setValidated] = useState<boolean>(false)
  const [log, setLog] = useState<string>('')
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(
    Object.keys($record).length === 0 ? undefined : 0
  )
  // const [mutationRecord, setMutationRecord] = useState<Array<string>>([])

  useEffect(
    function () {
      window.onkeydown = function navigate(e) {
        // e.preventDefault()

        const moduloLength = Object.keys($record).length

        if (e.ctrlKey && e.shiftKey && e.key === 'Tab')
          return setCurrentIndex((prev) => ((prev ?? 1) - 1 + moduloLength) % moduloLength)

        if (e.ctrlKey && e.key === 'Tab') return setCurrentIndex((prev) => ((prev ?? -1) + 1) % moduloLength)
      }

      return function revert() {
        window.onkeydown = null
      }
    },
    [$record]
  )

  const headers = Object.keys($record)

  // useEffect(
  //   function _evaluate() {
  //     /**
  //      * no input
  //      */

  //     if (!currentKey) return

  //     setValidated(false)

  //     console.log('interpreting...')

  //     const clear = window.setTimeout(function () {
  //       // if ($record[currentKey]) return setValidated(false)
  //       // constraint should be dealt within outer layer
  //       // but then again you should make it expressed somehow to let users know

  //       interpret(input, setLog, setValidated)
  //         .then(function (interpreted) {
  //           console.log('interpreted: ', interpreted)
  //           setRecord((prev) => ({ ...prev, [currentKey]: interpreted }))
  //           set$Record((prev) => ({ ...prev, [currentKey]: input }))
  //           // set$Record({ ...$record, [currentKey]: input })
  //           setValidated(true)
  //           setLog(JSON.stringify(interpreted, null, 2))
  //         })
  //         .catch(function () {
  //           setValidated(false)
  //         })
  //     }, 1000)

  //     return function clearPooling() {
  //       window.clearTimeout(clear)
  //     }
  //   },
  //   [input, currentKey]
  // )

  /**
   * todo :
   * input ", { in pair and relocate carrot
   */

  return (
    <Container>
      <Border>
        <Header>{header}</Header>

        <TextButtonsLayout1>
          <ButtonsContainer>
            <TextButton
              type='button'
              disabled={!interpret || currentIndex === undefined}
              onClick={async function (e) {
                if (!interpret || currentIndex === undefined) return

                await new Promise<string>((log) =>
                  interpret($record, log).then(function (record) {
                    log(JSON.stringify(record[headers[currentIndex]], null, 2))
                    setRecord(record)
                    setValidated(true)
                  })
                )
                  .then((log) => setLog(log))
                  .catch((err) => setLog(err?.message || 'failed to interpret'))

                // const partial = {}

                // await Promise.all(
                //   Object.keys($record).map((k) =>
                //     new Promise<string>(function logRace(resolve) {
                //       interpret($record[k], $record, record, resolve, setValidated)
                //         .then(function (interpreted) {
                //           Object.assign(partial, { [k]: interpreted })

                //           // set$Record({ ...$record, [currentKey]: input })
                //           setValidated(true)
                //           // log only if the callback doesn't call the log function
                //           resolve(JSON.stringify(interpreted, null, 2))
                //         })
                //         .catch(function (err) {
                //           setValidated(false)
                //           resolve(err?.message || `failed to interpret ${k}`)
                //         })
                //     }).then((partial) => setLog((prev) => ({ ...prev, [k]: partial })))
                //   )
                // )

                // setRecord(partial)
              }}
            >
              <Span>평가</Span>
            </TextButton>
            <TextButton
              type='button'
              // disabled={!validated}
              onClick={function (e) {
                if (
                  !validated &&
                  !window.confirm('the input is not validated\nare you sure to finish without evaluation?')
                )
                  return
                return onResolve($record, record, validated)
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

            <TextButton
              type='button'
              disabled={!configurable}
              onClick={function (e) {
                const key = window.prompt('Key 이름을 입력하세요')

                if (!key) return

                set$Record({ ...$record, [key]: '' })
                setCurrentIndex((prev) => (prev ?? -1) + 1)
                // setCurrentKey(key)
              }}
            >
              <Span>엔트리 추가</Span>
            </TextButton>
            <TextButton
              type='button'
              disabled={!configurable || currentIndex === undefined}
              onClick={function (e) {
                if (!configurable || currentIndex === undefined) return

                set$Record(Object.fromEntries(Object.entries($record).filter(([k]) => k !== headers[currentIndex])))
              }}
            >
              <Span>엔트리 삭제</Span>
            </TextButton>
          </ButtonsContainer>
        </TextButtonsLayout1>

        <InputLayout>
          <TextAreaLayout>
            <TextArea
              disabled={currentIndex === undefined}
              spellCheck={false}
              value={currentIndex === undefined ? '' : $record[headers[currentIndex]]}
              // rows={6}
              // css={{ flex: 1, border: '1px solid var(--color-border-base)' }}
              onChange={function (e) {
                if (validated) setValidated(false)
                set$Record((prev) => ({ ...prev, [headers[currentIndex!]]: e.target.value }))
              }}
              autoFocus
            />
          </TextAreaLayout>
          <TemplateLayout>
            <TemplateContainer>
              <TemplateHeader>Entries</TemplateHeader>
              {Object.keys($record).map((key, index) => (
                <EntryButton
                  // tabIndex={index + 1}
                  key={index}
                  type='button'
                  // onFocus={(e) => e.target.click()}
                  onClick={function (e) {
                    // setCurrentKey(key)
                    setCurrentIndex(index)
                    setLog(record[key] ? JSON.stringify(record[key], null, 2) : '')
                  }}
                  selected={currentIndex !== undefined && headers[currentIndex] === key}
                >
                  <Span>{key}</Span>
                </EntryButton>
              ))}
            </TemplateContainer>
          </TemplateLayout>
        </InputLayout>

        <StatusLayout>
          {/* would be better if interpret result has values by interpreting layers */}

          {/* <TextButtonsLayout1>
          {currentKey &&
            $record[currentKey].interpretation.map(({ parser }, index) => (
              <TextButton
                key={index}
                type='button'
                onClick={function (e) {
                  setCurrentInterpretationLayer($record[currentKey].interpretation[index])
                }}
              >
                <Span>{parser}</Span>
              </TextButton>
            ))}
        </TextButtonsLayout1> */}
          <FlexCenterDiv>
            {/* <Datalist id='dl'>
            {substitutes.map((substitute) => (
              <Option key={substitute}>{substitute}</Option>
              ))}
          </Datalist>
          <Input
            list='dl'
            value={matrix.at(matrix.length - 1)?.at(matrix[matrix.length - 1].length - 1) || ''}
            // disabled
          /> */}
            <Status validated={validated} data-desc={validated ? '정상적인 형식입니다' : '비정상적인 형식입니다'} />
            <ModeSVGContainer>
              <Rectangle />
            </ModeSVGContainer>
            {/* {raw.parser === 'matrix' && raw.resolve && (
            <MatrixCount>
              {raw.resolve.length !== 0
                ? `${raw.resolve.length}행 ${Math.max(
                    ...(raw.resolve as Matrix).map((row: Array<string>) => row.length)
                  )}열`
                : '0행 0열'}
            </MatrixCount>
          )} */}
          </FlexCenterDiv>
        </StatusLayout>

        <LogContainer>
          <Log>
            {/* this is not the raw string. this is a stringified value of the evaluated */}
            {log}
          </Log>
        </LogContainer>
      </Border>
    </Container>
  )
}

export default RawStringInput

const Container = styled(FlexColumnDiv)<{ width?: number; height?: number }>`
  padding: var(--padding-default, 8px);
  border-radius: var(--border-radius-default, 8px);
  background-color: white;
  box-shadow: var(--shadow-elevation4);
  min-width: 0;
  width: ${({ width }) => width || 600}px;
  height: ${({ height }) => height || 450}px;

  & > *:not(:first-child) {
    margin-top: 4px;
  }

  & textarea {
    ${SCROLL}
  }

  & textarea::placeholder {
    font-size: 28px;
    font-style: italic;
  }
`

const Border = styled(FlexColumnDiv)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  min-height: 0;
  min-width: 0;
`

const Header = styled(Span)`
  font-size: 16px;
  font-weight: bold;
  // font-style: italic;
  margin: 6px 0;
  word-break: auto-phrase;
`

const StatusLayout = styled(FlexCenterDiv)`
  justify-content: space-between;
  2px 4px;
`

const InputLayout = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;
`

const TemplateContainer = styled(FlexColumnDiv)`
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
  margin: 4px 0;
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
const LogContainer = styled(FlexColumnDiv)`
  flex: 1;
  overflow: hidden scroll;
  ${SCROLL}
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

const TextAreaLayout = styled(FlexColumnDiv)`
  flex: 1;
  padding: 4px;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));

  & > textarea {
    flex: 1;
    outline: none;
    border: none;
    margin: 0 8px;
    text-align: start;
    ${SCROLL}
  }
`

const TemplateLayout = styled(FlexColumnDiv)`
  width: 200px;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
  margin-left: 6px;
  border: 1px solid var(--color-border-base);

  & > div:nth-child(2) {
    border-top: 1px solid var(--color-border-base);
  }
`
const TemplateHeader = styled(Span)`
  font-size: 14px;
  text-align: center;
  padding: 6px;
  font-weight: bold;
`

const shrink = keyframes`
  0% {
    width : 100%;
  }

  100% {
    width : 0;
  }
`

const Delay = styled(FlexDiv)`
  position: relative;
  height: 4px;
  margin-top: 4px;

  &::after {
    content: ' ';
    border-radius: 4px;
    width: 0;
    height: 100%;
    position: absolute;
    background-color: blue;
    animation: 2s linear forwards paused ${shrink};
  }
`

const Log = styled.pre`
  white-space: pre-wrap;
  font-size: 12px;
  border: 1px solid var(--color-border-base);
  flex: 1;
  margin: 0;
  padding: 4px;
`

const EntryButton = styled(TextButton)<{ selected?: boolean }>`
  text-decoration: ${({ selected }) => (selected ? 'underline' : 'none')};
`
