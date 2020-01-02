const { exec } = require('pkg')
const path = require('path')
const sendEmail = require('./ethereal')
const config = require('config')
const logger = require('./logger')
const cleanWorkspace = require('./cleanWorkspace')

module.exports = async () => {
  const { customerName, kitName, kitVersion, test } = config.get('Builder').preparation
  const { ipServer, dirFtpSuporte } = config.get('Builder').repositoryConfig
  const kitInstaller = path.resolve('..', '..', 'kit-installer', 'package.json')
  const kitDestination = path.join(driverLetter, dirFtpSuporte, 'KITs', customerName)
  const now = new Date().toLocaleDateString()


  logger.info("pkg-installer -> kitDestination: %s", kitDestination)
  logger.info("pkg-installer -> kitInstaller: %s", kitInstaller)

  try {
    await exec([kitInstaller, '--target', 'host', '--output', `${kitDestination}\\kit-${customerName}-${kitName}-V${kitVersion}-cr-${now}.exe`])

    // do something  after making .exe at its ftp location
    //cleanWorkspace()

    sendEmail({ cliente: customerName, kitName, kitVersion, now, kitDestination })

  } catch (error) {
    logger.info(error);
  }

}