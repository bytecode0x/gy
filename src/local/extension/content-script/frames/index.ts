import { FlexCenterDiv, Form, Input, Label, SVGButton, Table, TextButton } from 'lib/frame/generic'
import styled from 'styled-components'

export const OverlayFormContainer = styled(Form)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 300px;
  min-height: 450px;
  border-radius: var(--border-radius-default, 8px);
  background-color: white;
  padding: 16px;
  box-shadow: var(--shadow-elevation4);
`
export const OverlayRow = styled(FlexCenterDiv)`
  justify-content: space-around;

  & + & {
    margin-top: 16px;
  }
`
export const OverlayLabel = styled(Label)`
  border-bottom: 1px solid black;
  min-width: 200px;
  text-align: center;
`

export const OverlayInput = styled(Input)`
  background-color: var(--color-bg-primary);
  box-shadow: inset 1px 1px 2px 1px grey;
  border-radius: 3px;
`

export const SubmitButton = styled(TextButton)`
  padding: 8px;
`

export const SmallRoundButton = styled(SVGButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  padding: 4px;
  background-color: white;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.6);

  font-size: 9px;

  & > svg {
    width: 9px;
    height: 9px;
  }

  & + & {
    margin-top: 4px;
  }
`

export const SpecificationTable = styled(Table)`
  border-color: var(--color-border-base);
  width: 100%;
  table-layout: fixed;

  & * {
    border-color: var(--color-border-base);
  }
  & td,
  th {
    white-space: nowrap;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const SVGCheckBox = styled(Input)`
  display: none;

  &:not(:checked) + label {
    background-color: transparent;
  }

  & + label:hover {
    background-color: var(--color-bg-primary-offset);
  }

  &:checked + label {
    background-color: var(--color-bg-primary-offset);
  }
`
