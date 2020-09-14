/**
 * @author João Trepichio
 * @async
 * @function sendEmail
 * @param  {Object} kit - task object from queue
 * @param  {String} filename - generated Kit filename
 * @returns {String} urlPreview of TestEmail
 */
module.exports = async (kit, filename) => {
  // Use at least Nodemailer v4.1.0
  const nodemailer = require("nodemailer");
  const logger = require("./logger");
  const config = require("config");

  const {
    ftpURL,
    rootFtp,
    dirFtpSuporte,
    dirSuporte,
    dirFtpKits,
    dirKits,
    ipServer,
    portServer
  } = config.get("Builder").repositoryConfig;

  //** const kitDestination = path.join(ftpURL, rootFtp, dirFtpSuporte, dirFtpKits)

  const { driverLetter } = config.get("Builder").builderConfig;
  // const kitDestination = `${driverLetter}\\${dirSuporte}\\${dirKits}\\${kit.customerName}\\${filename}`;
  const kitDestination = `http://${ipServer}:${portServer}/1/`;
  logger.info(`TCL: sendMail -> filename: ${filename}`);
  logger.info(`TCL: kitDestination: ${kitDestination}`);

  // return await new Promise((resolve, reject) => {

  // Generate SMTP service account from ethereal.email
  // nodemailer.createTestAccount((err, account) => {
  //   if (err) {
  //     logger.error('Failed to create a testing account. ' + err.message);
  //     // return process.exit(1);
  //     return reject(err.message)
  //   }

  logger.info("Credentials obtained, sending message...");
  let account = await nodemailer.createTestAccount();

  // Create a SMTP transporter object
  let transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });

  // let transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     user: "joao.trepichio@mbd.com.br",
  //     pass: "try==:)84" // naturally, replace both with your real credentials or an application-specific password
  //   }
  // });

  // let transporter = nodemailer.createTransport({
  //   host: "https://mail.google.com/",
  //   port: 465,
  //   secure: true,
  //   auth: {
  //     type: "OAuth2",
  //     clientId: "000000000000-xxx.apps.googleusercontent.com",
  //     clientSecret: "XxxxxXXxX0xxxxxxxx0XXxX0"
  //   }
  // });

  logger.info("Transport created...");
  // Message object
  let message = {
    from: "Suporte MBD <suporte@mbd.com.br>",
    to: "João <joao.trepichio@mbd.com.br>",
    subject: "Kit is ready! ✔",
    text: `You can download the generated kit ${kit.kitName} for ${kit.customerName} at ${kitDestination}!!`,
    html: `<p>You can <b>download</b> the generated kit <em>${kit.kitName}</em> for <b>${kit.customerName}</b> at <a href="${kitDestination}">${kitDestination}</a> !!!!</p>`
    // html: `<p>You can <b>download</b> the generated kit <em>${kit.kitName}</em> for <b>${kit.customerName}</b> at <a href="file:///${kitDestination}">${kitDestination}</a> !!!!</p>`
    // auth: {
    //   user: "user@example.com",
    //   refreshToken: "1/XXxXxsss-xxxXXXXXxXxx0XXXxxXXx0x00xxx",
    //   accessToken: "ya29.Xx_XX0xxxxx-xX0X0XxXXxXxXXXxX0x",
    //   expires: 1484314697598
    // }
  };
  logger.info("Message created...");

  // let sent = await new Promise((resv, rej) => {
  try {
    let info = await transporter.sendMail(message);
    logger.info("Message sent: %s", info.messageId);
    logger.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return nodemailer.getTestMessageUrl(info);
  } catch (error) {
    logger.info("Failed to send e-mail. Error: %s", error);
    throw error;
  }
  // transporter.sendMail(message, (err, info) => {
  //   if (err) {
  //     logger.error('Error occurred. ' + err.message);
  //     transporter.close()
  //     // return process.exit(1);
  //     return rej(err.message)
  //   }

  //   logger.info('Message sent: %s', info.messageId);
  //   // Preview only available when sending through an Ethereal account
  //   logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  //   transporter.close()
  //   return resv(true)
  // })
  //   })

  //** logger.info("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  //** logger.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  // if (!!sent) resolve(sent)
  // else reject(sent)

  // })
  // })
};
