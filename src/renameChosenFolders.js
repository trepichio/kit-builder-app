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
  for (const { name, version } of kitPrograms) {
    const originalPath = path.join(sysWDir, `${kitName}-v${version}-${name}`)
    const workingPath = path.join(sysWDir, name)

    logger.info(`Renaming folder ${kitName}-v${version}-${name} to ${name}`)
    fs.renameSync(originalPath, workingPath)
    logger.info(`Folder ${kitName}-v${version}-${name} renamed sucessfully.`)
  }

}
