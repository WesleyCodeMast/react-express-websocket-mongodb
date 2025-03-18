const nodemailer = require("nodemailer");

const adminEmail = process.env.MAIL_USERNAME
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


module.exports.sendCommissionsEmail = (name, email, commission_rate) => {
  transport.sendMail({
    from: adminEmail,
    to: email,
    subject: "Commissions rate updated",
    html: `<h1>Commissions rate updated</h1>
        <h2>Hello ${name}</h2>
        <p>You Commissions rate is updated, new Commissions rate is : ${commission_rate} %</p>
        </div>`,
  }).catch(err => console.log(err));
};