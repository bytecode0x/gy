import { FlexColumnCenterDiv, FlexColumnDiv, FlexDiv } from 'lib/frame/generic'
import { ProcedureSchema } from 'lib/gy/core/type/procedure'
import { SCROLL } from 'lib/styled-css-property'
import Add from 'local/extension/content-script/components/Atoms/buttons/Add'
import Task from 'local/extension/content-script/components/Task'
import { getSubstitutesOn } from 'local/extension/content-script/functions'
import { getStore } from 'local/extension/content-script/store'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { v4 } from 'uuid'
import shallow from 'zustand/shallow'

type Size = 'large' | 'medium' | 'small'

const Container = styled(FlexDiv)<{ size: Size }>`
  flex: 1;
  // padding: 12px;
  align-items: center;
  // justify-content: space-evenly;
  ${SCROLL}
  position : relative;
  font-size: ${({ size }) => (size === 'large' ? '16px' : size === 'medium' ? '12px' : '8px')};
`

const Layer = styled(FlexColumnCenterDiv)`
  padding: 1em;

  & > div + div {
    margin-top: 2em;
  }
`

const ConstraintLayout = styled(FlexColumnDiv)`
  position: absolute;
  right: 8px;
`

const ConstraintContainer = styled(FlexColumnDiv)`
  align-items: stretch;
  font-size: 12px;
  box-shadow: var(--shadow-elevation4, 0px 2px 4px rgba(0, 0, 0, 0.6));
  border-radius: var(--border-radius-default, 8px);
  padding: 4px;
  background-color: white;
  width: 250px;
  height: 300px;
  overflow: hidden scroll;
  ${SCROLL}
`

const Constraint = styled(FlexDiv)<{ fulfilled?: boolean }>`
  min-height: 25px;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  &::after {
    content: '';
    border-radius: 50%;
    background-color: ${({ fulfilled }) => (fulfilled ? 'green' : 'red')};
    box-shadow: var(--shadow-elevation4);
    width: 8px;
    height: 8px;
  }
`

/**
 * consider changing name in TaskPage
 */
const Flow = () => {
  const { id } = useParams()
  const [cache, procs, setState] = getStore()(
    useCallback((state) => [state.cache, state.cache.procedures, state.setState], []),
    shallow
  )
  const [size, setSize] = useState<Size>('large')
  const ps = useRef<ProcedureSchema>(
    (function () {
      const ps = procs.find((proc) => proc.id === id)!

      ps.tasks
        .flat()
        .flatMap((t) => t.actions)
        .forEach(function (as) {
          // @ts-ignore
          if (as.template === 'FORM') as.template = 'DEFINE'
        })

      return ps
    })()
  ).current

  // useEffect(function drawLinks() {
  //   console.log(`tasks : ${JSON.stringify(tasks)}\nlinks : ${JSON.stringify(links)}`)
  // }, [])

  useEffect(
    function log() {
      console.log('ps : ', ps)
      console.log('substitutes: ', substitutes)
      console.log(
        'predicate: ',
        ps.constraint.map((or) => or.some((key) => substitutes.includes(key)))
      )
    },
    [ps]
  )

  useEffect(
    function validateTasks() {
      /**
       * implement later
       */
      // console.log(`validating tasks`)
      ps.tasks.flat().forEach(function (task) {
        task.validated = true
      })
      setState({ cache: { ...cache, procedures: procs.slice() } })
    },
    [ps]
  )

  const substitutes = getSubstitutesOn(ps)

  return (
    <Container size={size}>
      <ConstraintLayout>
        <ConstraintContainer>
          {ps.constraint.map((or, index) => (
            <Constraint key={index} fulfilled={or.some((key) => substitutes.includes(key))}>
              {or.join(', ')}
            </Constraint>
          ))}
        </ConstraintContainer>
      </ConstraintLayout>
      {ps.tasks.flat().length === 0 && (
        <Add
          onClick={function (e) {
            ps.tasks.push([
              { id: v4(), name: '', actions: [], map: {}, validated: undefined, createdAt: Date.now(), leaf: true }
            ])
            setState({ cache: { ...cache, procedures: procs.slice() } })
          }}
        />
      )}
      {ps.tasks.map((layer, layerIndex) => (
        <Layer key={layerIndex}>
          {layer.map((task, index) => (
            <Task
              key={task.id}
              ts={task}
              // prev={layer[index - 1]} next={layer[index + 1]}
            />
          ))}
        </Layer>
      ))}

      {/* <SizeSelector value={size} onChange={(size) => setSize(size)} /> */}
    </Container>
  )
}

export default Flow
