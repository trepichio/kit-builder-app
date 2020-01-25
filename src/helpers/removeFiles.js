const findRemoveSync = require("find-remove")
const logger = require('../logger')

module.exports = ({ baseDir, mxLv = 1, strFile = '', msgAlert = 'Files will be deleted now', msgSuccess = 'Deleted sucessfully' }) => {
  logger.warn(msgAlert)
  const deletedFiles = findRemoveSync(baseDir, {
    maxLevel: mxLv,
    files: strFile,
    test: true
  })
  logger.info(msgSuccess, deletedFiles)
}
