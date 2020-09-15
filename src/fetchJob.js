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
const fs = require('fs')
const path = require('path')

const Queue = require("@kaliber/firebase-queue");

const serviceAccount = require("../kit-builder-queue-firebase-adminsdk-30lif-0220e11dc2.json");

const firebase = require("firebase").initializeApp(
  {
    servecieAccount: serviceAccount,
    databaseURL: "https://kit-builder-queue.firebaseio.com"
  },
  "Queue"
);

const firebaseDb = firebase.database();
const queueRef = firebaseDb.ref("queue");
const tasksRef = firebaseDb.ref("queue/tasks");
const kitsRef = firebaseDb.ref("kits");

//* the queue starts processing as soon as you create an instance
const queue = new Queue({ tasksRef, processTask, reportError });

/**
 ** processes tasks from Firebase Queue in order to generate and deploy a customized MBD Kit Installation
 *
 * @author João Trepichio
 * @async
 * @function processTask
 * @param  {Number} _numRetries=0 - maximum of retries
 * @param  {Object} task - object that comes from Firebase queue
 * @param  {Object} {snapshot - Object that has task plus properties like key
 * @param  {Function} setProgress}- updates progress in Firebase queue
 */
async function processTask(
  { _numRetries = 0, ...task },
  { snapshot, setProgress }
) {
  if (!!task.mailtask && task.emailSent !== true) {
    await setProgress(10);
    logger.info(`Sending E-mail link for Kit of ${task.mailtask.customerName}`);
    try {
      await setProgress(30);
      logger.info("=======  30%  =======");
      const urlPreview = await sendEmail(task.mailtask, task.filename);
      await setProgress(100);
      logger.info("=======  100% - E-mail sent sucessfully! =======");
      await updateKits(
        { _id: snapshot.key, ...task.mailtask },
        { emailSent: true, urlPreview }
      );
      return;
    } catch (error) {
      if (_numRetries > 2) {
        //TODO: Send an alert email to Administrator
        logger.error("==== reporting Error after all retries are done ====");
        reportError(error); // this marks the task as failed
      } else return { ...task, _numRetries: _numRetries + 1 };
    }
  }

  const lastTaskFile = path.resolve("./logs/lastTask.json");

  // do the work and optionally return a new task
  const {
    kitName,
    kitVersion,
    kitPrograms,
    customerName,
    CNPJ,
    test,
    CustomerRegistration
  } = task;
  const kitVersionPath = kitVersion.replace(new RegExp("\\.", "g"), "_");

  try {
    logger.info("=== Registering this task in lastTask.json file. ===");
    fs.writeFileSync(
      lastTaskFile,
      JSON.stringify({ _id: snapshot.key, ...task })
    );
  } catch (error) {
    logger.error(
      `The job for ${kitName}-v${kitVersion} could not be written in lastTask.json. You should check permissions or whatever reason to avoid problems with cleanup process whenever process shutdowns`
    );
    logger.error(error);
  }

  try {
    // Read and process task data
    logger.info(
      `=======  begin job with data: ${JSON.stringify(task)}  =======`
    );

    await setProgress(5);
    logger.info("=======  05%  =======");
    await renameChosenFolders(task);

    await setProgress(10);
    logger.info("=======  10%  =======");
    await copyFromChosenDB(task);

    await setProgress(20);
    logger.info("=======  20%  =======");
    await modifyConfigIni(task);

    await setProgress(30)
    logger.info("=======  30%  =======")
    await registerCustomerInDBCARDAPIO(task)

    await setProgress(40);
    logger.info("=======  40%  =======");
    await makeKitZip(task);

    await setProgress(50)
    logger.info("=======  50%  =======")
    await packKit(task)

    await setProgress(60)
    logger.info("=======  60%  =======")
    await cleanWorkspace(task)

    // await cleanWorkspace(task)

    // await setProgress(70)
    // logger.info("=======  70%  =======")
    // await sendEmail(task)

    await setProgress(90)
    logger.info("=======  90%  =======")

    try {
      fs.writeFileSync(lastTaskFile, `${kitName}-v${kitVersion} DONE!`)
    } catch (error) {
      logger.error(
        `The job for ${kitName}-v${kitVersion} IS DONE BUT it could not be written in lastTask.json. You should check permissions or whatever reason to avoid problems with cleanup process whenever process shutdowns`
      );
    }

    await setProgress(100);
    logger.info("=======  100%  =======");
    // res.send(`Kit ${task.kitName}-v${data.kitVersion} for ${data.customerName} is done! Id: ${data._id}`)
    logger.info(`Kit ${kitName}-v${kitVersion} for ${customerName} is done! Id: ${snapshot.key}`)

  } catch (e) {
    logger.error("========== Caught an exception during job process ==========")
    await stopProcessing(task)
    if (_numRetries > 2) {
      //TODO: Send an alert email to Administrator
      logger.error("==== reporting Error after all retries are done ====")
      reportError(e)  // this marks the task as failed
    }
    else return { ...task, _numRetries: _numRetries + 1 }
  }
}

function reportError(e) {
  logger.error(e)
  throw e.message
}

process.on("message", async function(msg) {
  console.log("Received a message from System");
  console.log("TCL: //main -> msg", msg);
  // const lastTaskFile = path.resolve('./logs/lastTask.json')

  if (msg == "shutdown") {
    await shutdownBuilder();
    process.exit(0);
  }
});

process.on("uncaughtException", async e => {
  console.log("========== UncaughtException happened!! ==========");
  console.error(e.stack);
  const lastTaskFile = path.resolve("./logs/lastTask.json");

  console.log("Trying to read last task from file and do the cleanup");
  try {
    const lastTask = JSON.parse(fs.readFileSync(lastTaskFile));
    await cleanWorkspace(lastTask);
    // fs.writeFileSync(lastTaskFile, `${lastTask.kitName}-v${lastTask.kitVersion} CLEANED!`)
    let updates = {};
    updates["/" + lastTask._id + "/_numRetries"] = null;
    updates["/" + lastTask._id + "/_error_details"] = e.stack;
    updates["/" + lastTask._id + "/_state"] = "error";
    await firebaseDb.ref(tasksRef).update(updates);

    //TODO: send an alert email??
  } catch (error) {
    console.error("Error during uncaughtException processing.");
    console.error(error);
  } finally {
    process.exit(1);
  }
});

// capture shutdown signal to perform a gracefull shutdown
process.on("SIGINT", async () => {
  console.log("========== SIGNINT Received ==========");
  await shutdownBuilder();
  process.exit(0);
});

async function shutdownBuilder() {
  console.log("========== Shutdown Queue and process! ==========");
  console.log("Received a message from System");

  // fs.writeFileSync(path.join('.', 'lastFailedTask.json'), JSON.stringify(cleanThisTask))
  console.log("Trying to read last task from file and do the cleanup");
  const lastTaskFile = path.resolve("./logs/lastTask.json");
  try {
    const lastTask = JSON.parse(fs.readFileSync(lastTaskFile));
    if (
      lastTask.status &&
      (lastTask.status === "done" || lastTask.status === "cleaned")
    ) {
      logger.log(lastTask.message);
      logger.log("There is no need to do cleanup this time!");
    } else {
      console.log("shutdownBuilder -> Starting cleanup");
      await cleanWorkspace(lastTask);
      fs.writeFileSync(
        lastTaskFile,
        JSON.stringify({
          message: `${lastTask.kitName}-v${lastTask.kitVersion} CLEANED!`,
          status: "cleaned"
        })
      );
      let updates = {};
      updates["/" + lastTask._id + "/_numRetries"] = null;
      updates["/" + lastTask._id + "/_state"] = null;
      await firebaseDb.ref(tasksRef).update(updates);
    }
  } catch (error) {
    console.log(
      "=========== Error during shutdown of process (stop/reload) =========="
    );
    console.error(error);
  } finally {
    console.log("Starting queue shutdown");
    await queue.shutdown();
    console.log("Finished queue shutdown");
  }
}

async function stopProcessing(data) {
  logger.warn("========== Job processing stopped! ==========");
  return await cleanWorkspace(data);
}

async function updateKits(data, attributes) {
  console.log("TCL: updateKits -> data", data);
  logger.info("Updating Firebase-queue");
  const kitVersionPath = data.kitVersion.replace(new RegExp("\\.", "g"), "_");

  let updates = {};
  for (const key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      const value = attributes[key];
      updates["/kits/all/" + data._id + "/" + key] = value;
      updates[
        "/kits/" +
          data.kitName +
          "/" +
          kitVersionPath +
          "/" +
          data._id +
          "/" +
          key
      ] = value;
      updates[
        "/customers/" + data.CNPJ + "/kits/all/" + data._id + "/" + key
      ] = value;
      updates[
        "/customers/" +
          data.CNPJ +
          "/kits/" +
          data.kitName +
          "/" +
          kitVersionPath +
          "/" +
          key
      ] = value;
    }
  }
  await firebaseDb.ref().update(updates);
}
