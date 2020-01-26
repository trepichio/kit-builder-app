const logger = require('./logger')
const renameChosenFolders = require('./renameChosenFolders')
const modifyConfigIni = require('./modifyConfigIni')
const makeKitZip = require('./makeKitZip')
const copyFromChosenDB = require('./copyFromChosenDB')
const registerCustomerInDBCARDAPIO = require('./registerCustomerInDBCARDAPIO')
const trycatchFn = require('./helpers/trycatchFn')
const packKit = require('./pkg-installer')
const cleanWorkspace = require('./cleanWorkspace')
const sendEmail = require('./ethereal')


const Queue = require('firebase-queue');
const Joi = require('@hapi/joi');

const serviceAccount = require("../kit-builder-queue-firebase-adminsdk-30lif-0220e11dc2.json");

var firebase = require('firebase').initializeApp({
  servecieAccount: serviceAccount,
  databaseURL: "https://kit-builder-queue.firebaseio.com"
}, 'Queue');

const firebaseDb = firebase.database()


// module.exports = (req, res) => {
const main = () => {

  const queueRef = firebaseDb.ref('queue');
  const kitsRef = firebaseDb.ref('kits');

  var queue = new Queue(queueRef, { sanitize: false }, async function (data, progress, resolve, reject) {

    const { kitName, kitVersion, kitPrograms, customerName, CNPJ, test, CustomerRegistration } = data
    const kitVersionPath = kitVersion.replace(new RegExp('\\.', 'g'), '_')

    // Read and process task data
    logger.info(`begin job with data: ${JSON.stringify(data)}`);
    progress(5)
      .catch(function (errorMessage) {
        // we've lost the current task, so stop processing
        stopProcessing(data)
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("5%");
    renameChosenFolders(data)

    progress(10)
      .catch(function (errorMessage) {
        logger.error(errorMessage)
        stopProcessing(data)
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("10%")
    copyFromChosenDB(data)

    progress(20)
      .catch(function (errorMessage) {
        stopProcessing(data)
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("20%");
    modifyConfigIni(data)

    progress(30)
      .catch(function (errorMessage) {
        logger.error(`Error from registerCustomerInDB: ${error}`)
        stopProcessing(data)
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("30%")
    const registered = await registerCustomerInDBCARDAPIO(data)

    if (!registered) {
      stopProcessing(data)
      reject("Failed to register Customer into Database") //* can pick new tasks
    }

    progress(40)
      .catch(function (errorMessage) {
        stopProcessing(data)
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("40%");
    makeKitZip(data)

    // Do some work
    progress(50)
      .catch(function (errorMessage) {
        stopProcessing(data)
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("50%");
    const zipPacked = await packKit(data)

    if (!zipPacked) {
      stopProcessing(data) //TODO: CleanWorkspace
      reject("Failed to pack Kit") //* can pick new tasks
    }

    progress(60)
      .catch(function (errorMessage) {
        logger.error("Failed while cleaning the workspace for the next job")
        reject(errorMessage) //* can pick new tasks
      })

    logger.info("60%");
    // do something  after making .exe at its ftp location
    cleanWorkspace(data)

    progress(70)
      .catch(function (errorMessage) {
        stopProcessing(data)
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("70%");
    await sendEmail(data).catch(logger.error)
    // const emailSent = await sendEmail(data)
    // logger.info("TCL: main -> emailSent", emailSent)
    // if (!emailSent) {
    //   //TODO: MAYBE START ANOTHER JOB AT QUEUE JUST TO RETRY SENDING EMAIL??
    //   logger.info(`Needs to retry to send email. Error: ${emailSent}`)
    // }

    progress(80)
      .then(
        doJob(data)
      )
      .catch(function (errorMessage) {
        stopProcessing(data)
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("80%")


    progress(90)
      .catch(function (errorMessage) {
        logger.error("Failed to update Firebase-Queue!!")
        reject(errorMessage) //* can pick new tasks
      })
    logger.info("90%")
    logger.info("Updating Firebase-queue")
    // console.log('return', work)
    var updates = {};
    updates['/kits/all/' + data._id + '/done'] = true;
    updates['/kits/' + data.kitName + '/' + kitVersionPath + '/' + data._id + '/done'] = true;
    updates['/customers/' + data.CNPJ + '/kits/all/' + data._id] = { done: true };
    updates['/customers/' + data.CNPJ + '/kits/' + data.kitName + '/' + kitVersionPath + '/done'] = true;
    firebaseDb.ref().update(updates);

    progress(100)
    logger.info("100%");
    // res.send(`Kit ${data.kitName}-v${data.kitVersion} for ${data.customerName} is done! Id: ${data._id}`)
    logger.info(`Kit ${data.kitName}-v${data.kitVersion} for ${data.customerName} is done! Id: ${data._id}`)


    //** NOT WORKING  AS INTENDED */
    process.on('uncaughtException', function (e) {
      console.error(e.stack)
      logger.info('Starting queue shutdown');
      queue.shutdown().then(function () {
        process.nextTick(function () {
          logger.info('Finished queue shutdown');
          process.exit(1)
        })
      });
    });

    // Finish the task asynchronously
    setTimeout(function () {
      resolve();
    }, 1000);

  });

  //** NOT WORKING AS INTENDED */
  process.on('SIGINT', function () {
    logger.info('Starting queue shutdown');
    queue.shutdown().then(function () {
      logger.info('Finished queue shutdown');
      process.exit(0);
    });
  });

  function doJob(jobData, done) {
    logger.info(`jobData:  ${JSON.stringify(jobData)}`)
    return
  }

  function stopProcessing(data) {
    logger.warn("Job processing stopped!")
    return cleanWorkspace(data)
  }


}

//** NOT WORKING  AS INTENDED*/
process.prependListener('uncaughtException', function (error) { logger.log('error', `from process: ${error}`); });




main()
