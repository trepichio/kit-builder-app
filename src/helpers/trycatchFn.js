const logger = require('../logger')

module.exports = async (fn, ...params) => {
  try {
    return await fn(...params)
  } catch (err) {
    logger.error(err)
    return undefined // or whatever you want
  }
}
