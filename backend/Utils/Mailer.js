/**
 * Created by Krishna Mishra author on 21/11/2022.
 * utils/mailer.js
 */
const nodeMailer = require('nodemailer')
const adminEmail = process.env.MAIL_USERNAME
const adminPassword = process.env.MAIL_PASSWORD
const mailHost = process.env.MAIL_HOST
const mailPort = process.env.MAIL_PORT

const sendMail = (to, subject, htmlContent) => {
  const transporter = nodeMailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: true,
    auth: {
      user: adminEmail,
      pass: adminPassword
    }
  })

  const options = {
    from: adminEmail,
    to: to,
    subject: subject,
    html: htmlContent
  }

  return transporter.sendMail(options)
}

module.exports = {
  sendMail: sendMail
}