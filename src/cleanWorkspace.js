const logger = require('./logger')
const canAccess = require('./helpers/canAccess')
const trycatchFn = require('./helpers/trycatchFn')
const findRemoveSync = require('find-remove')
const fs = require('fs')
const config = require('config')
const path = require('path')
const { trueCasePathSync } = require('true-case-path')

/**
 ** Cleanup of files (ini, databases, etc) and restores working folders to its original paths
 *
 * @author João Trepichio
 * @async
 * @function cleanWorkspace
 * @param {Object} data - object that comes from task queue
 */
module.exports = async (data) => {
  const { dirRootName, dirSysName, dirDBName, dirDBS, driverLetter } = config.get('Builder').builderConfig
  // const { customerName, kitName, kitVersion, kitPrograms, test } = config.get('Builder').preparation
  const { customerName, kitName, kitVersion, kitPrograms, test, dateCreated } = data

  // const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
  // const requestTime = new Date(dateCreated).toLocaleString('pt-br', options)

  const { dbExts, dbNames } = config.get('Builder').dbConfig

  const dbWDir = path.join(driverLetter, dirRootName, dirDBName)
  const sysWDir = path.join(driverLetter, dirRootName, dirSysName)
  const kitInstallerZip = path.resolve('..', '..', 'kit-installer', 'installer', 'assets')
  const zipPrefix = 'kit-'


  logger.info(`Cleaning ${dbWDir}`)
  const deletedFiles = findRemoveSync(dbWDir, { files: dbNames[kitName], extensions: dbExts, test })
  logger.info(`Successfully deleted the following files: ${JSON.stringify(deletedFiles)}`)

  const deletedZip = findRemoveSync(kitInstallerZip, { prefix: zipPrefix, extensions: [".zip", "rar"], test: false })
  logger.info(`Successfully deleted the following files: ${JSON.stringify(deletedZip)}`)
  const deletedJSON = findRemoveSync(kitInstallerZip, { extensions: [".json"], test: false })
  logger.info(`Successfully deleted the following files: ${JSON.stringify(deletedJSON)}`)



  logger.info("Renaming working folders back to original")
  for (const { name, version } of kitPrograms) {
    const originalPath = path.join(sysWDir, `${kitName}-v${version}-${name}`)
    const workingPath = path.join(sysWDir, name)

    logger.info('Looking for .ini.BAK files in order to replace original .ini content from them')
    const bakFilePath = await trycatchFn(trueCasePathSync, `${workingPath}\\config.ini.BAK`)
    console.log("TCL: bakFilePath", bakFilePath)
    const iniFilePath = await trycatchFn(trueCasePathSync, `${workingPath}\\config.ini`)
    console.log("TCL: iniFilePath", iniFilePath)

    if (bakFilePath && iniFilePath) {

      try {
        logger.info(`Replacing modified content of ${workingPath}\\config.ini by config.ini.BAK`)
        // const buffer = fs.readFileSync(path.join(workingPath, 'config.ini.BAK'))
        const bufferBak = fs.readFileSync(bakFilePath)
        // fs.writeFileSync(path.join(workingPath, 'config.ini'), buffer)
        fs.writeFileSync(iniFilePath, bufferBak)
        logger.info("config.ini has its original contents now. ")

      } catch (error) {
        logger.error(`Failed to revert content of config.ini from its bak file because of error: ${error}`)
      }
    }


    try {
      logger.info(`Renaming folder ${name} to its original ${originalPath}`)
      fs.renameSync(workingPath, originalPath)
      logger.info(`Folder ${name} renamed sucessfully.`)

    } catch (error) {
      logger.error(`Failed to rename folders back to its originals because of error: ${error}`)
    }
  }



}