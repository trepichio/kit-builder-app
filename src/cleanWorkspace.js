const logger = require('./logger')
const findRemoveSync = require('find-remove')
const fs = require('fs')
const config = require('config')
const path = require('path')


module.exports = (data) => {
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



  logger.info("Renaming working folders back to original")
  for (const program of kitPrograms) {
    const originalPath = path.join(sysWDir, `${kitName}-v${kitVersion}-${program}`)
    const workingPath = path.join(sysWDir, program)

    logger.info(`Replacing modified content of ${workingPath}\\config.ini by config.ini.BAK`)
    const buffer = fs.readFileSync(path.join(workingPath, 'config.ini.BAK'))
    fs.writeFileSync(path.join(workingPath, 'config.ini'), buffer)
    logger.info("config.ini has its original contents now. ")

    logger.info(`Renaming folder ${program} to its original ${originalPath}`)
    fs.renameSync(workingPath, originalPath)
    logger.info(`Folder ${program} renamed sucessfully.`)
  }



}