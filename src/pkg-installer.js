const { exec } = require("pkg");
const path = require("path");
const config = require("config");
const logger = require("./logger");
const fs = require("fs");

/**
 ** It packs NodeJS, Zip file of Kit and the whole Installer project into an .EXE
 *
 * @author João Trepichio
 * @function packKit
 * @param  {Object} data - task object from queue
 */
module.exports = async data => {
  const driverLetter = "C:";
  // const { customerName, kitName, kitVersion, test } = config.get('Builder').preparation
  const { customerName, kitName, kitVersion, dateCreated, test } = data;
  const {
    ipServer,
    dirFtpSuporte,
    dirFtpKits,
    dirSuporte,
    dirKits
  } = config.get("Builder").repositoryConfig;
  const kitInstaller = path.resolve(
    "..",
    "..",
    "kit-installer",
    "package.json"
  );
  const kitDestination = path.join(
    driverLetter,
    dirSuporte,
    dirKits,
    customerName
  );
  const kitFtpDestination = path.join(ipServer, "kits");
  //** const kitFtpDestination = path.join(ipServer, dirSuporte, dirFtpKits)
  // const now = new Date().toLocaleDateString()
  const options = { year: "numeric", month: "numeric", day: "numeric" };
  const requestTime = new Date(dateCreated).toLocaleString("pt-br", options);

  logger.info("pkg-installer -> kitDestination: %s", kitDestination);
  logger.info("pkg-installer -> kitInstaller: %s", kitInstaller);
  const filename = `kit-${customerName}-${kitName}-V${kitVersion}-CR${requestTime}.exe`;
  try {
    await exec([
      kitInstaller,
      "--target",
      "host",
      "--output",
      `${kitDestination}\\${filename}`
    ]);
    logger.info("pkg-installer -> packed!!");
    fs.copyFileSync(
      `${kitDestination}\\${filename}`,
      `\\\\${kitFtpDestination}\\${filename}`
    );
    return filename;
  } catch (error) {
    logger.info(`pkg-installer -> could not pack!! Error: ${error}`);
    // return false
    throw error;
  }
};
