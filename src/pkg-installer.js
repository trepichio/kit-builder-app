const { exec } = require('pkg')
const path = require('path')
const config = require('config')
const logger = require('./logger')

module.exports = async (data) => {
  const driverLetter = 'C:'
  // const { customerName, kitName, kitVersion, test } = config.get('Builder').preparation
  const { customerName, kitName, kitVersion, dateCreated, test } = data
  const { ipServer, dirFtpSuporte } = config.get('Builder').repositoryConfig
  const kitInstaller = path.resolve('..', '..', 'kit-installer', 'package.json')
  const kitDestination = path.join(driverLetter, dirFtpSuporte, 'KITs', customerName)
  // const now = new Date().toLocaleDateString()
  const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
  const requestTime = new Date(dateCreated).toLocaleString('pt-br', options)


  logger.info("pkg-installer -> kitDestination: %s", kitDestination)
  logger.info("pkg-installer -> kitInstaller: %s", kitInstaller)

  try {
    await exec([kitInstaller, '--target', 'host', '--output', `${kitDestination}\\kit-${customerName}-${kitName}-V${kitVersion}-cr-${requestTime}.exe`])
    logger.info("pkg-installer -> packed!!")
    return true
  } catch (error) {
    logger.info(`pkg-installer -> could not pack!! Error: ${error}`)
    return false
  }

}