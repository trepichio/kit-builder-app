const findRemoveSync = require("find-remove")
const logger = require('../logger')

module.exports = ({ baseDir, mxLv, strFile, msgAlert, msgSuccess }) => {
  console.log(msgAlert)
  const deletedFiles = findRemoveSync(baseDir, {
    maxLevel: mxLv,
    files: strFile
  })
  logger.info(msgSuccess, deletedFiles)
}
