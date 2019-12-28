// Use at least Nodemailer v4.1.0
const nodemailer = require('nodemailer');


module.exports = (kit) => {

  // Generate SMTP service account from ethereal.email
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error('Failed to create a testing account. ' + err.message);
      return process.exit(1);
    }

    console.log('Credentials obtained, sending message...');

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

    // Message object
    let message = {
      from: 'Suporte MBD <suporte@mbd.com.br>',
      to: 'Analista <analista@mbd.com.br>',
      subject: 'Kit is ready! ✔',
      text: `You can download the generated kit ${kit.kitName} for ${kit.cliente} at ${kit.kitDestination}!!`,
      html: `<p>You can <b>download</b> the generated kit <em>${kit.kitName}</em> for <b>${kit.cliente}</b> at <a href="#">${kit.kitDestination}</a> !!!!</p>`
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log('Error occurred. ' + err.message);
        return process.exit(1);
      }

      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
  });
}