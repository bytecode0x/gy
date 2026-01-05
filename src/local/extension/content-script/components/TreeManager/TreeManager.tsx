import RawStringInput from 'lib/component/RawStringInput'
import { InterpretObj } from 'lib/event/sementic'
import { FlexCenterDiv, FlexColumnDiv, FlexDiv, Input, Span, TextButton } from 'lib/frame/generic'
import { Border, ElevatedForm, EllipticalLabel, TextButtonsLayout1 } from 'lib/frame/sementic'
import { matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { ProcedureDescriptor } from 'lib/gy/core/type/procedure'
import { TreeDescriptor, TreeFindOptions } from 'lib/gy/core/type/tree'
import { SCROLL } from 'lib/styled-css-property'
import { overlayLoader, pushMessage } from 'lib/util/dom/render'
import { TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { getEvHandler } from '../../event/entity/content-event-handler'
import { safeGetBody } from '../../functions/app'
import { setOverlay } from '../../store'

const Container = styled(ElevatedForm)`
  width: 720px;
  height: 480px;
`

const OptionsLayout = styled(FlexColumnDiv)<{ placeholder?: string }>`
  flex: 2;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  font-size: 12px;

  overflow: hidden scroll;
  ${SCROLL}

  &::after {
    content : ${({ placeholder }) => placeholder || ''}
    text-align : center;
    color : grey;
    size : 2em;
    font-style: italic;
  }
`

const OptionContainer = styled(FlexDiv)`
  justify-content: space-between;
  align-items: center;

  & + & {
    margin-top: 6px;
  }
`

const OuterBorder = styled(Border)`
  flex: 1;

  & > * {
    margin: 6px 0;
  }
`

const Checkbox = styled(Input)``

const ContentLayer = styled(FlexDiv)`
  flex: 1;
  min-height: 0;

  & > *:not(:first-child) {
    margin-left: 6px;
  }
`

const TreeSpecificationLayer = styled(FlexColumnDiv)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  font-size: 12px;

  overflow: hidden scroll;
  ${SCROLL}
`

const Specification = styled(FlexColumnDiv)`
  align-items: flex-start;

  & + & {
    margin-top: 4px;
  }
`

const SpecificationKey = styled(Span)`
  font-style: italic;
  font-size: 1.25em;
`

const SpecificationValue = styled(Span)``

const IndicesContainer = styled(FlexDiv)`
  align-items: center;
  justify-content: space-between;
`

const Index = styled(TextButton)<{ current?: boolean }>`
  ${({ current }) => current && 'font-weight : bold;'}
`

type TreeManagerProps = {
  /**
   * evHandler can be different according to context
   * so you need to wrap to use this component independantly
   */
  fetcher: (options: Array<TreeFindOptions>, index: number) => Promise<[Array<TreeDescriptor>, number]>
  merger: (atid: Array<string>) => Promise<TreeDescriptor>
  remover: (atid: Array<string>) => Promise<void>
  namer: (tid: string, name: string) => Promise<void>
  onResolve: (selected: Set<string>) => any
  /**
   * access procedures through props instead of store directly for reusability
   */
  $procedures: Array<ProcedureDescriptor<TriggerPreset>>
}

const TreeManager: FC<TreeManagerProps> = ({ fetcher, merger, remover, onResolve, namer, $procedures }) => {
  const [treeMatrix, setTreeMatrix] = useState<Array<Array<TreeDescriptor>>>([])
  const [currIndex, setCurrIndex] = useState<number>(0)
  const [lastIndex, setLastIndex] = useState<number>(0)
  const [selected, setSelected] = useState<TreeDescriptor>()
  const [keywords, setKeywords] = useState<Array<Array<string>>>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const checked = useRef<Set<string>>(new Set()).current

  const optionsContainerRef = useRef<HTMLDivElement>(null)

  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(function (e) {
    if (checked.has(e.target.value)) checked.delete(e.target.value)
    else checked.add(e.target.value)
  }, [])

  const inputKeywords = useCallback(function () {
    const evHandler = getEvHandler()
    const record = { input: '' }

    const revertOverlay = setOverlay(
      <RawStringInput
        header='Keywords'
        initial={record}
        onReject={function () {
          revertOverlay()
        }}
        onResolve={async function ({ input: $input }, { input }) {
          if ($input && !matrixSchema.safeParse(input).success)
            return pushMessage({
              message: `It must be resolved in matrix`,
              layer: safeGetBody().querySelector('#push')
            })

          setKeywords(input || [])
          revertOverlay()
        }}
        interpret={(raw) =>
          evHandler.sendEvent<InterpretObj>({
            name: 'INTERPRET_OBJ',
            payload: { raw },
            meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
          })
        }
      />
    )
  }, [])

  const remove = useCallback(
    async function () {
      if (checked.size === 0) return

      if (!optionsContainerRef.current) return

      setIsLoading(true)

      const revertLoader = overlayLoader(optionsContainerRef.current)

      const removals = Array.from(checked)

      await remover(removals)
      revertLoader()
      setTreeMatrix((prev) =>
        // @ts-ignore
        prev.with(
          currIndex,
          prev[currIndex].filter((tr) => removals.every((tid) => tid !== tr.tid))
        )
      )
      setIsLoading(false)
    },
    [currIndex]
  )

  const merge = useCallback(
    async function () {
      if (checked.size < 2) return window.confirm('적어도 2개 이상의 트리(Tree)를 선택해야 합니다')

      setIsLoading(true)

      await merger(Array.from(checked))
      // @ts-ignore
      setTreeMatrix((prev) => prev.with(currIndex, prev[currIndex].concat([tr])))
      setIsLoading(false)
    },
    [currIndex]
  )

  const selectAll = useCallback(function () {
    if (!optionsContainerRef.current) return

    optionsContainerRef.current.querySelectorAll(`${Checkbox}`).forEach(function (checkbox) {
      if (checked.has((checkbox as HTMLInputElement).value)) checked.delete((checkbox as HTMLInputElement).value)
      else checked.add((checkbox as HTMLInputElement).value)
      Object.assign(checkbox, { checked: !(checkbox as HTMLInputElement).checked })
    })
  }, [])

  useEffect(
    function search() {
      if (!optionsContainerRef.current || !keywords) return

      console.log('searching;', keywords, currIndex)

      setIsLoading(true)

      const revertLoader = overlayLoader(optionsContainerRef.current)
      fetcher(
        keywords.map((row) => ({ keywords: row })),
        currIndex
      ).then(function ([pagination, count]) {
        console.log('count: ', count)
        console.log('pagination: ', pagination)
        revertLoader()
        setLastIndex(Math.ceil(count / 50))
        const matrix: Array<Array<TreeDescriptor>> = []
        matrix.splice(currIndex, 0, pagination)
        setTreeMatrix(matrix)
        setIsLoading(false)
      })
    },
    [keywords, currIndex]
  )

  useEffect(
    function log() {
      console.log('treeMatrix : ', treeMatrix)
    },
    [treeMatrix]
  )

  /**
   * todo
   * pagination index
   * => set atr empty first on pagination
   * search bar
   */

  return (
    <Container
      onSubmit={function (e) {
        e.preventDefault()

        onResolve(checked)
      }}
    >
      <OuterBorder>
        <TextButtonsLayout1>
          <FlexCenterDiv>
            <TextButton type='submit' disabled={isLoading}>
              확인
            </TextButton>
            <TextButton type='button' onClick={selectAll} disabled={isLoading}>
              전체선택
            </TextButton>
          </FlexCenterDiv>

          <FlexCenterDiv>
            <TextButton type='button' onClick={inputKeywords} disabled={isLoading}>
              검색
            </TextButton>
            <TextButton type='button' onClick={merge} disabled={isLoading}>
              병합
            </TextButton>
            <TextButton type='button' onClick={remove} disabled={isLoading}>
              삭제
            </TextButton>
          </FlexCenterDiv>
        </TextButtonsLayout1>
        <ContentLayer>
          <OptionsLayout ref={optionsContainerRef}>
            {treeMatrix[currIndex]?.map((tr) => (
              <OptionContainer key={tr.tid}>
                <EllipticalLabel
                  title={tr.name}
                  htmlFor={tr.tid}
                  onMouseOver={function () {
                    setSelected(tr)
                  }}
                >
                  {tr.name}
                </EllipticalLabel>
                <Checkbox id={tr.tid} name={tr.tid} value={tr.tid} type='checkbox' onChange={onChange} />
              </OptionContainer>
            ))}
          </OptionsLayout>
          <TreeSpecificationLayer>
            {selected && (
              <>
                <Specification>
                  <SpecificationKey>Name</SpecificationKey>
                  <TextButton
                    onClick={function () {
                      const name = window.prompt('새로운 이름을 입력하세요')
                      if (!name) return

                      namer(selected.tid, name).then(function () {
                        selected.name = name
                        setTreeMatrix(treeMatrix.slice())
                      })
                    }}
                  >
                    {selected.name}
                  </TextButton>
                </Specification>
                <Specification>
                  <SpecificationKey>Procedure</SpecificationKey>
                  <Span>{$procedures.find((pd) => pd.pid === selected.pid)?.name || '알 수 없음'}</Span>
                </Specification>

                <Specification>
                  <SpecificationKey>Keywords</SpecificationKey>
                  <Span>{selected.keywords.join(',')}</Span>
                </Specification>

                <Specification>
                  <SpecificationKey>Date</SpecificationKey>
                  <Span>{new Date(selected.date * 1000).toLocaleString()}</Span>
                </Specification>

                <Specification>
                  <SpecificationKey>Sequence</SpecificationKey>
                  <Span>{selected.sequence}</Span>
                </Specification>
              </>
            )}
          </TreeSpecificationLayer>
        </ContentLayer>
        <TextButtonsLayout1>
          <IndicesContainer>
            <Index
              disabled={Math.floor(currIndex / 5) < 1}
              onClick={function () {
                setCurrIndex((Math.floor(currIndex / 5) - 1) * 5)
              }}
              type='button'
            >
              -
            </Index>
            {Array.from({ length: Math.min(5, lastIndex - Math.floor(currIndex / 5) * 5) }).map((_, i) => (
              <Index
                key={i}
                current={i === currIndex % 5}
                disabled={i === currIndex % 5}
                onClick={function () {
                  setCurrIndex(Math.floor(currIndex / 5) * 5 + i)
                }}
              >
                {Math.floor(currIndex / 5) * 5 + i + 1}
              </Index>
            ))}
            <Index
              disabled={Math.floor(currIndex / 5) === Math.floor(lastIndex / 5)}
              onClick={function () {
                setCurrIndex((Math.floor(currIndex / 5) + 1) * 5)
              }}
              type='button'
            >
              +
            </Index>
          </IndicesContainer>
        </TextButtonsLayout1>
      </OuterBorder>
    </Container>
  )
}

export default TreeManager
