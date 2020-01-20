const fs = require("fs")
const logger = require("./logger")

module.exports = path => {
  logger.info(`Backing up original file in ${path} as Config.ini.bak`)
  try {
    fs.renameSync(`${path}/Config.ini`, `${path}/Config.ini.bak`)
    logger.info(`Backup of ${path}\\Config.ini created successfully.`)
  } catch (error) {
    logger.error(`Failed to backup Config.ini. Error: ${error}`)
  }
}
