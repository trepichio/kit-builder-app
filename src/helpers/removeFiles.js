const findRemoveSync = require("find-remove")
const logger = require('../logger')
/**
 ** Remove files from a folder and subfolders
 *
 * @author João Trepichio
 * @param  {PathLike} {baseDir - path from where files will be deleted
 * @param  {Number} mxLv - default=1; level of subfolders
 * @param  {String} strFile - default=''; string to match filenames
 * @param  {String} msgAlert - show this message when function invoked
 * @param  {String} msgSuccess}- show this message when t completes
 */
module.exports = ({ baseDir, mxLv = 1, strFile = '', msgAlert = 'Files will be deleted now', msgSuccess = 'Deleted sucessfully' }) => {
  logger.warn(msgAlert)
  const deletedFiles = findRemoveSync(baseDir, {
    maxLevel: mxLv,
    files: strFile,
    test: true
  })
  logger.info(msgSuccess, deletedFiles)
}
