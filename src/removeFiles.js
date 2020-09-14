const findRemoveSync = require("find-remove");
const logger = require("./logger");
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
module.exports = ({
  baseDir,
  mxLv = 1,
  strFile = "",
  msgAlert = "Files will be deleted now.",
  msgSuccess = "Files deleted successfully",
  test = false
}) => {
  logger.info(msgAlert);
  const deletedFiles = findRemoveSync(baseDir, {
    maxLevel: mxLv,
    files: strFile,
    test: test
  });
  logger.info(`The following files were deleted: ${deletedFiles}`);
  logger.info(msgSuccess);
};
