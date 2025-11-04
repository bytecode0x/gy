const workdir = (await prxy['WORK_DIR']) || [['']]
const ext = await prxy['EXTENSION_TAB']
const __GY_TREE_DIR__ = [['C:\\Users\\user\\Desktop\\product\\tree']]
const __GY_TREE_FILE_NAME__ = [[`daiso_${await prxy['id']}`]]

return {
  ext,
  workdir,
  __GY_TREE_DIR__,
  __GY_TREE_FILE_NAME__
}
