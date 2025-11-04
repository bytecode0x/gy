import Config from 'lib/asset/svg/Config'
import Dashboard2 from 'lib/asset/svg/Dashboard2'
import { FlexColumnDiv, Span, SVGButton } from 'lib/frame/generic'
import { useNavigate } from 'react-router-dom'
import { APP_LOGO } from 'specifications'
import styled from 'styled-components'

const Container = styled(FlexColumnDiv)`
  width: 75px;
  justify-content: flex-start;
  align-items: center;
  padding: 24px 6px;
  border-right: 1px solid var(--color-border-base);

  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  & > * {
    -webkit-app-region: no-drag;
  }

  & > * {
    margin: 6px 0px;
  }

  & svg {
    width: 16px;
    height: 16px;
  }
`

const Header = styled(Span)`
  font-size: 20px;
  font-weight: bold;
`

const NavigationButton = styled(SVGButton)<{ currentAt: boolean }>`
  & > svg {
    width: 22px;
    height: 22px;
    color: ${({ currentAt }) => (currentAt ? '#2c6fd2' : '#6B6B6B')};
  }

  &:hover > svg {
    color: #2c6fd2;
  }
`
const NavigationButtonUpperLayout = styled(FlexColumnDiv)`
  flex: 1;
  align-items: center;
`

const NavigationButtonLowerLayout = styled(FlexColumnDiv)`
  flex: 1;
  justify-content: flex-end;
  align-items: center;
`

const Navigation = () => {
  const navigate = useNavigate()

  return (
    <Container>
      <Header>{APP_LOGO}</Header>
      <NavigationButtonUpperLayout>
        <NavigationButton
          currentAt={window.location.pathname === '/'}
          onClick={function () {
            navigate('/')
          }}
        >
          <Dashboard2 />
        </NavigationButton>
      </NavigationButtonUpperLayout>

      <NavigationButtonLowerLayout>
        <NavigationButton
          currentAt={window.location.pathname === '/config'}
          onClick={function () {
            navigate('/config')
          }}
        >
          <Config />
        </NavigationButton>
      </NavigationButtonLowerLayout>
    </Container>
  )
}

export default Navigation
