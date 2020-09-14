const fs = require('fs')
const path = require('path')
const logger = require('./logger')

module.exports = async (lastTask) => {

  const assetsFolder = path.resolve('../../kit-installer/installer/assets/')

  try {
    logger.info("=== Writing this task to a file in assets folder of kit-Installer. ===");
    fs.writeFileSync(
      path.join(assetsFolder, 'thisJob.json'),
      JSON.stringify(lastTask)
    );
    return
  } catch (error) {
    logger.error(
      `copyJobFileToAssets -> There was an error writing job to assets folder of kit-installer. Error: ${error}`
    );
    throw error
  }
}