import { FlexDiv, TextButton } from 'lib/frame/generic'
import { EllipticalLabel } from 'lib/frame/sementic'
import { SCROLL } from 'lib/styled-css-property'
import { FC, useState } from 'react'
import styled from 'styled-components'

const Container = styled(FlexDiv)`
  min-width: 0;
  overflow: scroll hidden;
  align-items: center;
  height: 30px;

  & > button {
    border: 1px soid var(--color-border-base, rgba(0, 0, 0, 0.1));
    padding: 6px;
    margin: 2px 4px;
    box-shadow: var(--shadow-elevation);
    white-space: nowrap;
  }

  ${SCROLL}

  ::-webkit-scrollbar {
    width: 2px;
    height: 2px;
  }
`

const TabContainer = styled(TextButton)<{ active?: boolean }>`
  // width: 80px;
  height: 25px;
  font-size: 12px;
  background-color: ${({ active }) =>
    active ? `var(--color-bg-primary-offset, grey)` : `var(--color-bg-primary, white)`};
`

type TabBarProps = {
  initialTabId?: string
  tabs: Array<{ id: string; name: string }>
  onActive: ({ id, name }: { id: string; name: string }) => void
  onOrderChange?: (tabs: Array<{ id: string; name: string }>) => void
}

const TabBar: FC<TabBarProps> = ({ tabs, initialTabId, onActive, onOrderChange }) => {
  const [currentTab, setCurrentTab] = useState<string | undefined>(initialTabId)

  let swapTarget: number

  return (
    <Container
      onWheel={function (e) {
        e.preventDefault()
        // console.log('wheeling : ', e.deltaX, e.deltaY, e.deltaZ)
        e.currentTarget.scrollBy(e.deltaY, 0)
      }}
    >
      {tabs.map(({ id, name }, index) => (
        <TabContainer
          onDragStart={function (e) {
            if (!onOrderChange) return
            e.dataTransfer.dropEffect = 'move'
          }}
          onDragOver={function (e) {
            if (!onOrderChange) return
            e.preventDefault()
            swapTarget = index
            e.dataTransfer.dropEffect = 'move'
          }}
          onDragEnd={function (e) {
            if (!onOrderChange) return
            e.preventDefault()
            // setDragTarget(-1)
            if (swapTarget !== undefined) {
              const insertUpper = index > swapTarget

              const sub = insertUpper
                ? tabs.slice(swapTarget, index).toSpliced(0, 0, ...tabs.splice(index, 1))
                : // without assigning first, It would invoke an error
                  ([...tabs.slice(index + 1, swapTarget + 1), undefined].with(
                    swapTarget - index,
                    tabs.splice(index, 1).at(0)
                  ) as Array<{ id: string; name: string }>)

              onOrderChange(
                insertUpper ? tabs.splice(swapTarget, sub.length, ...sub) : tabs.splice(index, sub.length, ...sub)
              )

              // if (insertUpper) tabs.splice(swapTarget, sub.length, ...sub)
              // else tabs.splice(index, sub.length, ...sub)

              // console.log(
              //   'after: ',
              //   task.actions.map((as) => as.name)
              // )

              // const t = task.actions[swapTarget]
              // task.actions[swapTarget] = task.actions[index]
              // task.actions[index] = t
            }
            setCurrentTab(undefined)

            // console.log('end transfer : ', e.dataTransfer)
          }}
          // onMouseUp={function () {}}
          draggable
          type='button'
          key={id}
          active={currentTab === id}
          onClick={function () {
            onActive({ id, name })
            setCurrentTab(id)
          }}
        >
          <EllipticalLabel title={name}>{name}</EllipticalLabel>
        </TabContainer>
      ))}
    </Container>
  )
}

export default TabBar
