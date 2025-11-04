import Folder2 from 'lib/asset/svg/Folder2'
import { SVGButton } from 'lib/frame/generic'

const OpenWorkDirectory = () => {
  // const reqOpenWorkDir = useCallback(() => {
  //   window.eh.sendEvent<OpenWorkDir>('OPEN_WORKDIR', 'MAIN')
  // }, [])

  return (
    <SVGButton data-desc2='작업 폴더 열기' onClick={process.env.NODE_ENV === 'production' ? undefined : undefined}>
      <Folder2 />
    </SVGButton>
  )
}

export default OpenWorkDirectory
