import { ActionPreset } from 'local/desktop/main/gy/type/action.preset'
import { OPEN_AI_ASSISTANT } from './action.assistant'
import { CLICK } from './action.click'
import { DEFINE } from './action.define'
import { EVAL_BINDING_TAB } from './action.eval-binding-tab'
import { INITIATE_PROCEDURE } from './action.execute-procedure'
import { EXTRACT } from './action.extract'
import { LOAD_URL } from './action.load-url'
import { PAUSE } from './action.pause'
// import { PROMPT } from './prompt'
// import { READ_TEXT_FILE } from './read-text-file'
import { EDIT_IMAGE } from './action.edit-image'
import { SCRAPE } from './action.scrape'
import { SELECT } from './action.select'
import { TYPE } from './action.type'
import { ActionInput } from './type'

export const actionInput: {
  [template in ActionPreset['template']]: ActionInput<Extract<ActionPreset, { template: template }>>
} = {
  // DOWNLOAD,
  DEFINE,
  LOAD_URL,
  SCRAPE,
  SELECT,
  EVAL_BINDING_TAB,
  CLICK,
  TYPE,
  EXTRACT,
  PAUSE,
  INITIATE_PROCEDURE,
  OPEN_AI_ASSISTANT,
  EDIT_IMAGE
  // FORM
}
