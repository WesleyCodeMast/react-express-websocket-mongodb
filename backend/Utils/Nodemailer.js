const nodemailer = require("nodemailer");

const adminEmail = process.env.MAIL_USERNAME
const adminPassword = process.env.MAIL_PASSWORD
const mailHost = process.env.MAIL_HOST
const mailPort = process.env.MAIL_PORT

const transport = nodemailer.createTransport({
  host: mailHost,
  service: process.env.MAIL_SERVICE,
    port: mailPort,
    auth: {
      user: adminEmail,
      pass: adminPassword
    }
});

module.exports.sendConfirmationEmail = (name, email, confirmationCode, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Please confirm your account",
    html: html,
  }).catch(err => console.log(err));
};


module.exports.sendCreditLink = (name, email, confirmationCode, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Credit Add Link notification",
    html: html,
  }).catch(err => console.log(err));
};


module.exports.sendChatLink = (name, email, confirmationCode, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Chat with Advisor Link notification",
    html: html,
  }).catch(err => console.log(err));
};


module.exports.sendScheduleChatBookingNotification = (name, email, client, client_email, date, intervals, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Schedule Chat Booking Notification",
    html: html,
  }).catch(err => console.log(err));
};

module.exports.ChatOnlineMailNotification = (name, email, client, client_email, html) => {
  
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Incoming Chat Notification",
    html: html,
  }).catch(err => console.log(err));
};


module.exports.AdvisorOnlineMailNotification = (name, email, client, client_email, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: client_email,
    subject: name +" Advisor Online Notification",
    html: html,
  }).catch(err => console.log(err));
};

module.exports.ChatOfflineMailNotification = (name, email, client, client_email, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "You have an incoming chat!",
    html: html,
  }).catch(err => console.log(err));
};

module.exports.sendChatLogNotification = (name, email, client, client_email, chat_html) => {
  // console.log(chat_html)
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Chat log "+name,
    html: chat_html,
  }).catch(err => console.log(err));
};

module.exports.sendPasswordResetNotification = (name,username,email,htmlAdvisor) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Reset Password "+username,
    html: htmlAdvisor,
  }).catch(err => console.log(err));
};


module.exports.sendReviewNotification = (name, email, client, client_email, chat_html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Review notification",
    html: chat_html,
  }).catch(err => console.log(err));
};


module.exports.sendInboxMessageNotification = (name, email, client, client_email, chat_html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Inbox message notification",
    html: chat_html,
  }).catch(err => console.log(err));
};

module.exports.sendChatLogKeywordNotification = (name, email, client, client_email, chat_html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "keyword found in Chat notification",
    html: chat_html,
  }).catch(err => console.log(err));
};

module.exports.sendCommissionsEmail = (name, email, commission_rate, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Commissions rate updated notification",
    html: html,
  }).catch(err => console.log(err));
};

module.exports.sendApproveEmail = (name, email, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Advisor approved notification",
    html: html,
  }).catch(err => console.log(err));
};

module.exports.sendNotificationToCustomerByAdmin = (name, email, html) => {
 
  transport.sendMail({
    from: 'Confideas '+adminEmail,
    to: email,
    subject: "Notification by Admin",
    html: html,
  }).catch(err => console.log(err));
};