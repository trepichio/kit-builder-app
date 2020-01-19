const logger = require('./logger')
const fs = require('fs')
const config = require('config')
const path = require('path')


module.exports = ({ customerName, kitName, kitVersion, kitPrograms, test }) => {
  const { dirRootName, dirSysName, dirDBName, dirDBS, driverLetter } = config.get('Builder').builderConfig
  // const { customerName, kitName, kitVersion, kitPrograms, test } = config.get('Builder').preparation
  // const { customerName, kitName, kitVersion, kitPrograms, test } = data.preparation
  const { dbExts, dbNames } = config.get('Builder').dbConfig

  const sysWDir = path.join(driverLetter, dirRootName, dirSysName)



  logger.info("Renaming original folders to working name")
  for (const program of kitPrograms) {
    const originalPath = path.join(sysWDir, `${kitName}-v${kitVersion}-${program}`)
    const workingPath = path.join(sysWDir, program)

    logger.info(`Renaming folder ${kitName}-v${kitVersion}-${program} to ${program}`)
    fs.renameSync(originalPath, workingPath)
    logger.info(`Folder ${kitName}-v${kitVersion}-${program} renamed sucessfully.`)
  }

}
