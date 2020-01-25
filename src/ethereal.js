

module.exports = async (kit) => {
  // Use at least Nodemailer v4.1.0
  const nodemailer = require('nodemailer');
  const logger = require('./logger')

  // return await new Promise((resolve, reject) => {

  // Generate SMTP service account from ethereal.email
  // nodemailer.createTestAccount((err, account) => {
  //   if (err) {
  //     logger.error('Failed to create a testing account. ' + err.message);
  //     // return process.exit(1);
  //     return reject(err.message)
  //   }

  //   logger.info('Credentials obtained, sending message...');
  let account = await nodemailer.createTestAccount()

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

  logger.info('Transport created...');
  // Message object
  let message = {
    from: 'Suporte MBD <suporte@mbd.com.br>',
    to: 'Analista <analista@mbd.com.br>',
    subject: 'Kit is ready! ✔',
    text: `You can download the generated kit ${kit.kitName} for ${kit.customerName} at ${kit.kitDestination}!!`,
    html: `<p>You can <b>download</b> the generated kit <em>${kit.kitName}</em> for <b>${kit.customerName}</b> at <a href="#">${kit.kitDestination}</a> !!!!</p>`
  };
  logger.info('Message created...');

  // let sent = await new Promise((resv, rej) => {
  let info = await transporter.sendMail(message)
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

  logger.info("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  logger.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  // if (!!sent) resolve(sent)
  // else reject(sent)

  // })
  // })
}