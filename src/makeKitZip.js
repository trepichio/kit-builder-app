const AdmZip = require('adm-zip')
const config = require('config')
const logger = require('./logger')
const path = require('path')

module.exports = (data) => {

  const kitZip = new AdmZip()

  // const standardFolders = ['Acesso', 'Install', 'DB']
  const { standardFolders } = config.get('Builder').builderConfig
  // const { rootDir, customerName, kitPrograms, kitName, kitVersion, dateCreated } = config.get('Builder').preparation
  const { rootDir, customerName, kitPrograms, kitName, kitVersion, dateCreated } = data

  const opt = { year: 'numeric', month: 'numeric', day: 'numeric' };
  const requestTime = new Date(dateCreated).toLocaleString('pt-br', opt)
  logger.info(`makeKitZip -> requestTime ${requestTime}`)


  const kitProgramsPath = kitPrograms.map(program => `Sistemas\\${program}`)
  const folders = [...standardFolders, ...kitProgramsPath]

  logger.info("makeKitZip -> Let's make the Zip archive for this Kit.")
  for (const folder of folders) {
    kitZip.addLocalFolder(`C:\\MBD\\${folder}`, `${rootDir}\\${folder}`, (filename) => new RegExp('^(.(?!.*\.bak$))*$', 'gi').test(filename))
    logger.info(`makeKitZip -> ${folder} added to kitZip archive.`)
  }

  const filename = `${customerName}-${kitName}-V${kitVersion}-CR${requestTime}.zip`
  const assetsFolder = path.resolve('../../kit-installer/installer/assets/')

  logger.info("makeKitZip -> Let's try to write the zip file on disk")
  try {
    kitZip.writeZip(path.join(assetsFolder, filename))
    logger.info(`makeKitZip -> Zip file ${filename} created successfully at ${assetsFolder}`)
  } catch (error) {
    logger.error(`makeKitZip -> Failed to write kitZip file for ${customerName}. Error: ${error}`)
  }
}