const fs = require("fs");
/**
 * Verifies if provided paths exist and can be acessed
 *
 * @author João Trepichio
 * @async
 * @function canAccess
 * @param  {Array} ...paths - Paths to check.
 * @returns {Boolean} - can or cannot access these paths
 */
module.exports = async function canAccess(...paths) {
  for (const path of paths) {
    if (fs.existsSync(path)) {
      console.log(`path exists: ${path}`);
      try {
        fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
        console.log(`The following path can be acessed by user ${path}`);
        // The check succeeded
        return true;
      } catch (error) {
        console.log(
          `User may not have permission to read or write this path: ${path}`
        );
        console.log(error);
        return false;
      }
    } else {
      console.log(`TCL: ${path} not found`);
      return false;
    }
  }
};
