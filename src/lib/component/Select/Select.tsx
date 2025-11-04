import { FlexCenterDiv, FlexColumnDiv, FlexDiv, Input, Span, TextButton } from 'lib/frame/generic'
import { Border, ElevatedForm, EllipticalLabel, TextButtonsLayout1 } from 'lib/frame/sementic'
import { SCROLL } from 'lib/styled-css-property'
import { FC, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

type SelectProps = {
  header: string
  options: Array<string>
  defaultValueIndex?: number
  labels?: Array<string>
  singular?: boolean
  required?: boolean
  placeholder?: string
  onResolve: (chosens: Array<string>, indices: Array<number>) => any
  onReject: (reason: string) => any
}

/**
 * this component is for consuming Selct Action
 */
const Select: FC<SelectProps> = ({
  header,
  options,
  defaultValueIndex,
  labels,
  singular,
  required,
  placeholder,
  onResolve,
  onReject
}) => {
  const [mode, setMode] = useState<'list' | 'gallery'>('list')
  const preview = useRef<HTMLDivElement>(null)
  const optionsContainer = useRef<HTMLDivElement>(null)
  /**
   * todo
   * for the case that multiple images in one option cause overflow
   * you can't use ellipsis as It force overflow property to be hidden
   * so you need to implement scroll with wheeling to see the hidden parts
   */

  useEffect(function log() {
    console.log('default value index: ', defaultValueIndex)
  }, [])

  return (
    <Container
      onSubmit={function (e) {
        e.preventDefault()
        // @ts-ignore

        const chosens = Array.from(e.currentTarget.querySelectorAll(Checkbox))
          .filter((checkbox) => (checkbox as HTMLInputElement).checked)
          .map((ele) => parseInt(ele.id, 10))

        if (required && chosens.length === 0) return

        onResolve(
          options.filter((_, index) => chosens.includes(index)),
          chosens
        )
      }}
    >
      <OuterBorder>
        <Header>{header}</Header>

        <TextButtonsLayout1>
          <FlexCenterDiv>
            <TextButton type='submit'>확인</TextButton>
            <TextButton
              type='button'
              onClick={function (e) {
                onReject('canceled by user')
              }}
            >
              취소
            </TextButton>
          </FlexCenterDiv>
          <FlexCenterDiv>
            <TextButton
              type='button'
              onClick={function (e) {
                setMode('list')
              }}
            >
              리스트
            </TextButton>
            <TextButton
              type='button'
              onClick={function (e) {
                setMode('gallery')
              }}
            >
              갤러리
            </TextButton>
            {!singular && (
              <TextButton
                type='button'
                onClick={function (e) {
                  if (!optionsContainer.current) return
                  optionsContainer.current
                    .querySelectorAll(`${Checkbox}`)
                    .forEach((checkbox) =>
                      Object.assign(checkbox, { checked: !(checkbox as HTMLInputElement).checked })
                    )
                }}
              >
                전체선택
              </TextButton>
            )}
          </FlexCenterDiv>
        </TextButtonsLayout1>
        <ContentLayout>
          <OptionsLayout data-placeholder={placeholder || '옵션이 없습니다'} mode={mode} ref={optionsContainer}>
            {(labels || options).map((label, index) => (
              <OptionContainer key={index} mode={mode}>
                <Option htmlFor={index.toString()}>
                  <OptionLabel
                    title={options[index]}
                    ref={function (ref) {
                      if (!ref) return
                      ref.innerHTML = label

                      Array.from(ref.querySelectorAll('img')).forEach(function (img) {
                        img.onmouseenter = function () {
                          if (!preview.current) return
                          preview.current.innerHTML = img.outerHTML
                        }
                      })
                    }}
                  />
                </Option>
                <Checkbox
                  id={index.toString()}
                  name='select'
                  type={singular ? 'radio' : 'checkbox'}
                  required={required && singular}
                  defaultChecked={index === defaultValueIndex}
                />
              </OptionContainer>
            ))}
          </OptionsLayout>
          {mode === 'gallery' && <PreviewLayout ref={preview} />}
        </ContentLayout>
      </OuterBorder>
    </Container>
  )
}

export default Select

const Container = styled(ElevatedForm)<{ width?: number; height?: number }>`
  width: ${({ width }) => width || 800}px;
  height: ${({ height }) => height || 600}px;
`

const OuterBorder = styled(Border)`
  flex: 1;
  padding: 4px;
  min-height: 0;
  min-width: 0;

  & > *:not(:first-child) {
    margin-top: 6px;
  }
`

const Header = styled(Span)`
  font-size: 14px;
  padding: 4px;
`

const ContentLayout = styled(FlexDiv)`
  flex: 1;
  min-height: 0;
  moin-width: 0;
`

const OptionsLayout = styled(FlexColumnDiv)<{ mode: 'list' | 'gallery' }>`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  font-size: 12px;
  align-items: ${({ mode }) => (mode === 'gallery' ? 'center' : 'stretch')};
  flex-wrap: ${({ mode }) => (mode === 'gallery' ? 'wrap' : 'nowrap')};
  min-height: 0;
  min-width: 0;

  &:empty::after {
    flex: 1;
    text-align: center;
    content: attr(data-placeholder);
    font-style: italic;
    font-size: 32x;
    color: grey;
  }

  overflow: hidden scroll;
  ${SCROLL}
`

const OptionContainer = styled(FlexDiv)<{ mode: 'list' | 'gallery' }>`
  display: ${({ mode }) => (mode === 'list' ? 'flex' : 'inline-block')};
  ${({ mode }) => mode === 'list' && 'justify-content: space-between;'}
  ${({ mode }) => mode === 'list' && 'align-items: center;'}
  
  // border-bottom: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: 4px;

  & + & {
    margin-top: 6px;
  }

  & input[type='radio'],
  & input[type='checkbox'] {
    display: ${({ mode }) => (mode === 'list' ? 'inline-block' : 'none')};
  }

  &:has(label:first-child + :checked:last-child) > label:first-child {
    mask-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(0, 0, 255, 0.5));
  }
`

// sementic : generic
const Option = styled(EllipticalLabel)``

const OptionLabel = styled(FlexCenterDiv)`
  justify-content: space-between;

  & img {
    max-width: 60px;
    max-height: 60x;
    object-fit: contain;
  }
`

const Checkbox = styled(Input)``

const PreviewLayout = styled(FlexColumnDiv)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  min-width: 0;
  min-height: 0;
  align-items: center;
  margin-left: 4px;
  overflow: scroll;
  ${SCROLL}

  & img {
    object-fit: contain;
    width: 90%;
  }
`
