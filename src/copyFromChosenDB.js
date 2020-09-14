const logger = require("./logger");
const fs = require("fs");
const config = require("config");
const path = require("path");
const canAccess = require("./helpers/canAccess");

/**
 ** Copy database files for requested Kit to working DB folder
 *
 * @author João Trepichio
 * @async
 * @function copyFromChosenDB
 * @param {Object} data - object that comes from task queue
 */
module.exports = async data => {
  const {
    dirRootName,
    dirSysName,
    dirDBName,
    dirDBS,
    driverLetter
  } = config.get("Builder").builderConfig;
  // const { customerName, kitName, kitVersion, kitPrograms, test } = config.get('Builder').preparation
  const { customerName, kitName, kitVersion, kitPrograms, test } = data;
  const { dbExts, dbName, dbNames, dbPath } = config.get("Builder").dbConfig;

  const dbsDir = path.join(driverLetter, dirRootName, dirDBS);
  const dbWDir = path.join(driverLetter, dirRootName, dirDBName);
  // const dbWDir = dbPath

  const originalPath = path.join(dbsDir, `${kitName}-v${kitVersion}-DB`);
  const workingPath = dbWDir;
  logger.info(
    `It will try to copy original DBs for ${kitName} to working folder`
  );
  for (const dbName of dbNames[kitName]) {
    for (const dbExt of dbExts) {
      const dbSrc = path.join(originalPath, `${dbName}${dbExt}`);
      const dbDest = path.join(workingPath, `${dbName}${dbExt}`);

      if (await canAccess(dbSrc)) {
        try {
          logger.info(`Copying ${dbSrc} to ${dbDest}`);
          fs.copyFileSync(dbSrc, dbDest);
          logger.info(`${dbSrc} copied successfully.`);
          break;
        } catch (error) {
          logger.error(`Failed to copy ${dbSrc} to ${dbDest}. Error: ${error}`);
        }
      }
    }
  }
};
