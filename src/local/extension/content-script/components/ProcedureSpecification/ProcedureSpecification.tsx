import Clipboard from 'lib/asset/svg/Clipboard'
import Write from 'lib/asset/svg/Write'
import {
  Abbr,
  Dialog,
  FlexCenterDiv,
  FlexColumnDiv,
  FlexDiv,
  Input,
  Label,
  Span,
  SVGButton,
  TextArea,
  TextButton
} from 'lib/frame/generic'
import { TextButtonsLayout1 } from 'lib/frame/sementic'
import { ProcedureDescriptor } from 'lib/gy/core/type/procedure'
import { SCROLL } from 'lib/styled-css-property'
import { pushMessage } from 'lib/util/dom/render'
import { TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { FC, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

const SpecificationLayout = styled(FlexColumnDiv)`
  background-color: white;
  box-shadow: var(--shadow-elevation4);
  border-radius: 4px;
  width: 450px;
  height: 450px;
  padding: 16px;
`

const Specification = styled(FlexColumnDiv)`
  min-height: 0;
  padding: 6px;
  align-items: stretch;

  & + & {
    margin-top: 8px;
  }
`

const SpecificationHeader = styled(FlexCenterDiv)`
  justify-content: flex-start;
`

const SpecificationLabel = styled(Label)``

const SpecificationHeaderLabel = styled(Label)`
  font-style: italic;
  font-size: 18px;
  margin-right: 6px;
`

const SpecificationContent = styled(FlexColumnDiv)`
  align-items: stretch;
`

const Description = styled(Abbr)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DescriptionInputLayout = styled(FlexColumnDiv)`
  width: 400px;
  height: 300px;
  min-height: 0;

  padding: 6px;

  background-color: white;
  box-shadow: var(--shadow-elevation4);
  border-radius: 4px;
`

const ButtonsContainer = styled(FlexCenterDiv)`
  font-size: 12px;
  margin-bottom: 6px;

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
const TextAreaContainer = styled(FlexColumnDiv)`
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

type ProcedureSpecificationProps = {
  pd: ProcedureDescriptor<TriggerPreset>
  onResolve: () => any
}

const ProcedureSpecification: FC<ProcedureSpecificationProps> = ({ pd, onResolve }) => {
  // const [config, setConfig] = useState<ProcedureRecord['config']>(pd.config)
  const [description, setDescription] = useState<string>(pd.descriptive)

  /**
   * 초기 값만 pr 에서 받아와 resolve 하는 경우 config 를 할당하는 방식
   *
   * 문제는 여기서 config 바깥에 있는 description 같은 property 인데
   * 이것은 나중에 다룰 것
   */

  const copyToClipboard = useCallback(
    function () {
      navigator.clipboard.writeText(pd.pid).then(
        function onSuccess() {
          return pushMessage({
            message: `클립보드로 복사되었습니다`,
            layer: safeGetBody().querySelector('#push')
          })
        },
        function onFail() {
          return pushMessage({
            message: `클립보드로 복사에 실패했습니다`,
            layer: safeGetBody().querySelector('#push')
          })
        }
      )
    },
    [pd]
  )

  useEffect(function () {}, [])

  return (
    <SpecificationLayout>
      <TextButtonsLayout1>
        <TextButton
          onClick={function () {
            onResolve()
          }}
        >
          확인
        </TextButton>
      </TextButtonsLayout1>
      <Specification>
        <SpecificationHeader>
          <SpecificationHeaderLabel>Name</SpecificationHeaderLabel>
        </SpecificationHeader>
        <SpecificationContent>{pd.name}</SpecificationContent>
      </Specification>
      <Specification>
        <SpecificationHeader>
          <SpecificationHeaderLabel>Id</SpecificationHeaderLabel>
          <SVGButton data-desc2='복사하려면 클릭하세요' onClick={copyToClipboard}>
            <Clipboard />
          </SVGButton>
        </SpecificationHeader>
        <SpecificationContent>{pd.pid}</SpecificationContent>
      </Specification>
      <Specification>
        <SpecificationHeader>
          <SpecificationHeaderLabel>Description</SpecificationHeaderLabel>
          <Dialog id='description-input-dialog'>
            <DescriptionInputLayout>
              <ButtonsContainer>
                <TextButton
                  type='button'
                  onClick={function (e) {
                    // matrix should be computed instantly for resolving

                    const textarea = safeGetBody().querySelector(`#description-input`) as HTMLTextAreaElement
                    pd.descriptive = textarea.value

                    setDescription(textarea.value)

                    const dialog = safeGetBody().querySelector(`#description-input-dialog`) as HTMLDialogElement
                    dialog.close()
                  }}
                >
                  <Span>확인</Span>
                </TextButton>
                <TextButton
                  type='button'
                  onClick={function (e) {
                    const dialog = safeGetBody().querySelector(`#description-input-dialog`) as HTMLDialogElement
                    dialog.close()
                  }}
                >
                  <Span>취소</Span>
                </TextButton>
              </ButtonsContainer>
              <TextAreaContainer>
                <TextArea id='description-input' defaultValue={description} placeholder='Procedure Description' />
              </TextAreaContainer>
            </DescriptionInputLayout>
          </Dialog>
          <SVGButton
            data-desc2='수정하려면 클릭하세요'
            onClick={function (e) {
              // matrix should be computed instantly for resolving
              const dialog = safeGetBody().querySelector(`#description-input-dialog`) as HTMLDialogElement
              dialog.showModal()
            }}
          >
            <Write />
          </SVGButton>
        </SpecificationHeader>
        <SpecificationContent>
          <Description>{description || 'no description'}</Description>
        </SpecificationContent>
      </Specification>
      <Specification>
        <SpecificationHeader>
          <SpecificationHeaderLabel>Background Availability</SpecificationHeaderLabel>
        </SpecificationHeader>
        <SpecificationContent>
          {pd.backgroundAvailability === undefined ? 'unknown' : pd.backgroundAvailability ? 'true' : 'false'}
        </SpecificationContent>
      </Specification>
      <Specification>
        <SpecificationHeader>
          <SpecificationHeaderLabel>Config</SpecificationHeaderLabel>
        </SpecificationHeader>
        <SpecificationContent>
          <FlexDiv>
            <Input
              type='checkbox'
              name='preserveTree'
              id='preserveTree'
              defaultChecked={pd.config.preserveTree}
              onChange={function (e) {
                pd.config.preserveTree = e.target.checked
              }}
            />
            <SpecificationLabel
              data-desc2='프로시져(Procedure)가 수행된 이후 트리(Tree)를 보존합니다'
              htmlFor='preserveTree'
            >
              preserve tree
            </SpecificationLabel>
          </FlexDiv>
          <FlexDiv>
            <Input
              type='checkbox'
              name='strict'
              id='strict'
              defaultChecked={pd.config.strict}
              onChange={function (e) {
                pd.config.strict = e.target.checked
              }}
            />
            <SpecificationLabel data-desc2='에러(Error)가 발생하면 프로시져(Procedure)를 중단합니다' htmlFor='strict'>
              strict
            </SpecificationLabel>
          </FlexDiv>
          <FlexDiv>
            <Input
              type='checkbox'
              name='invokeEffectImmediately'
              id='invokeEffectImmediately'
              defaultChecked={pd.config.invokeEffectImmediately}
              onChange={function (e) {
                pd.config.invokeEffectImmediately = e.target.checked
              }}
            />
            <SpecificationLabel
              data-desc2='프로시져(Procedure)가 완료되면 그 즉시 이펙트(Effect)를 실행합니다'
              htmlFor='invokeEffectImmediately'
            >
              invoke effect immediately
            </SpecificationLabel>
          </FlexDiv>

          {/* <FlexDiv>
            <Input
              type='checkbox'
              name='waitOnEffectResolved'
              id='waitOnEffectResolved'
              defaultChecked={pd.config.invokeEffectImmediately}
              onChange={function (e) {
                pd.config.waitOnEffectResolved = e.target.checked
              }}
            />
            <SpecificationLabel data-desc2='이펙트(Effect)가 끝날 때까지 기다립니다' htmlFor='waitOnEffectResolved'>
              wait until effect resolves
            </SpecificationLabel>
          </FlexDiv> */}
        </SpecificationContent>
      </Specification>
    </SpecificationLayout>
  )
}

export default ProcedureSpecification
