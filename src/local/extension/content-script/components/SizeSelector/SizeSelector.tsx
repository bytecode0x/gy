import React from 'react'
import { createPortal } from 'react-dom'

import { FlexDiv, Option, Select } from 'lib/frame/generic'
import styled from 'styled-components'

const UtliityContainer = styled(FlexDiv)`
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 12px;
`

const SizeSelect = styled(Select)`
  font-size: 12px;
`
type Size = 'large' | 'medium' | 'small'

type Props = {
  value: Size
  onChange: (size: Size) => any
}

const SizeSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <>
      {createPortal(
        <UtliityContainer>
          <SizeSelect
            name='size'
            value={value}
            onChange={function (e) {
              onChange(e.target.value as Size)
            }}
          >
            <Option value='large'>100%</Option>
            <Option value='medium'>75%</Option>
            <Option value='small'>50%</Option>
          </SizeSelect>
        </UtliityContainer>,
        document.querySelector('#content-middle')!
      )}
    </>
  )
}

export default SizeSelector
