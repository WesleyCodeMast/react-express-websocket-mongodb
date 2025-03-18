const nodemailer = require("nodemailer");

const adminEmail = process.env.MAIL_SUPPORT
const adminPassword = process.env.MAIL_PASSWORD
const mailHost = process.env.MAIL_HOST
const mailPort = process.env.MAIL_PORT

const transport = nodemailer.createTransport({
  host: mailHost,
    port: mailPort,
    auth: {
      user: adminEmail,
      pass: adminPassword
    }
});


module.exports.sendNotification = (name, email, body) => {
  transport.sendMail({
    from: adminEmail,
    to: email,
    subject: "Recived Notification from admin",
    html: `<h1>Notification</h1>
        <h2>Hello ${name}</h2>
        <p>${body}</p>
        </div>`,
  }).catch(err => console.log(err));
};