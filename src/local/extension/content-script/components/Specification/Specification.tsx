import Loader from 'lib/asset/svg/Loader'
import { Div, FlexCenterDiv, FlexColumnDiv, Span } from 'lib/frame/generic'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

const Container = styled(Div)`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 20px;
`

const LoaderContainer = styled(FlexCenterDiv)`
  flex: 1;
`

const Data = styled(FlexColumnDiv)``

const Key = styled(Span)`
  font-style: bold;
`

const Value = styled(Span)``

type SpecificationProps = {
  promise: Promise<Record<string, string>> | Record<string, string>
}

const Specification: React.FC<SpecificationProps> = ({ promise }) => {
  const [spec, setSpec] = useState<Record<string, string>>()

  useEffect(function specify() {
    if (promise instanceof Promise) promise.then((_spec) => setSpec(_spec))
    else setSpec(promise)
  }, [])

  if (!spec)
    return (
      <LoaderContainer>
        <Loader />
      </LoaderContainer>
    )
  return (
    <Container>
      {Object.entries(spec).map(([key, value]) => (
        <Data key={key}>
          <Key>{key}</Key>
          <Value>{value}</Value>
        </Data>
      ))}
    </Container>
  )
}

export default Specification
