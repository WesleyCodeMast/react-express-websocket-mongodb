const express = require("express");
const createError = require('http-errors');
const { writeFile } = require('fs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path')
const app = express();
const dotenv = require("dotenv").config();
require('./initDB')();

app.set("view engine", "ejs");


var fs = require('fs');
var adminPath = __dirname + '/uploads/admin/profile/';
var advisorPath = __dirname + '/uploads/advisor/profile/';
var clientPath = __dirname + '/uploads/client/profile/';
var chatPath = __dirname + '/uploads/chat/';

var advisorMPath = __dirname + '/uploads/advisor/message/';
var clientMPath = __dirname + '/uploads/client/message/';


if (!fs.existsSync(adminPath))
  fs.mkdirSync(adminPath, { recursive: true });
if (!fs.existsSync(advisorPath))
  fs.mkdirSync(advisorPath, { recursive: true });
if (!fs.existsSync(clientPath))
  fs.mkdirSync(clientPath, { recursive: true });
if (!fs.existsSync(chatPath))
  fs.mkdirSync(chatPath, { recursive: true });
if (!fs.existsSync(advisorMPath))
  fs.mkdirSync(advisorMPath, { recursive: true });
if (!fs.existsSync(clientMPath))
  fs.mkdirSync(clientMPath, { recursive: true });

const cors = require("cors");

var webSocketPort = 5002;

var io = require('socket.io')(webSocketPort, {
  ws: true,
  cors: {
    origin: "*",
    methods: 'GET,PUT,POST,DELETE,OPTIONS'.split(','),
    credentials: true
  },
  maxHttpBufferSize: 1e8
});


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


// Admin Api Routes

const AdminAuthRoute = require('./Routes/Admin/Auth.route');
const AdminKeywordRoute = require('./Routes/Admin/Keyword.route');
const AdminSubscriptionRoute = require('./Routes/Admin/Subscription.route');
const AdminRoute = require('./Routes/Admin/Admin.route');
const AdminReviewRoute = require('./Routes/Admin/Review.route');
const AdminTicketRoute = require('./Routes/Admin/Ticket.route');
const AdminSettingRoute = require('./Routes/Admin/Setting.route');
const AdminStripeRoute = require('./Routes/Admin/Stripe.route');
const AdminPaymentRoute = require('./Routes/Admin/Payment.route');
const AdminAdvisorAgreementRoute = require('./Routes/Admin/AdvisorAgreement.route');
const AdminClientAgreementRoute = require('./Routes/Admin/ClientAgreement.route');
const AdminGroupRoute = require('./Routes/Admin/Group.route');

app.use('/admin', AdminRoute);
app.use('/admin/auth', AdminAuthRoute);
app.use('/admin/groups', AdminGroupRoute);
app.use('/admin/reviews', AdminReviewRoute);
app.use('/admin/keywords', AdminKeywordRoute);
app.use('/admin/tickets', AdminTicketRoute);
app.use('/admin/settings', AdminSettingRoute);
app.use('/admin/subscriptions', AdminSubscriptionRoute);
app.use('/admin/stripe', AdminStripeRoute);
app.use('/admin/payments', AdminPaymentRoute);
app.use('/admin/advisor-agreement', AdminAdvisorAgreementRoute);
app.use('/admin/client-agreement', AdminClientAgreementRoute);


// Client Api Routes

const UserAuthRoute = require('./Routes/User/Auth.route');

app.use('/user/auth', UserAuthRoute);

// Client Api Routes

const ClientRoute = require('./Routes/Client/Client.route');
const ClientAuthRoute = require('./Routes/Client/Auth.route');
const ClientReviewRoute = require('./Routes/Client/Review.route');
const ClientTicketRoute = require('./Routes/Client/Ticket.route');
const ClientMessageRoute = require('./Routes/Client/Message.route');
const ClientChatRoute = require('./Routes/Client/Chat.route');
const ClientChatHistoryRoute = require('./Routes/Client/ChatHistory.route');
const ClientCalendarAvailabilityRoute = require('./Routes/Client/CalendarAvailability.route');

app.use('/client', ClientRoute);
app.use('/client/auth', ClientAuthRoute);
app.use('/client/reviews', ClientReviewRoute);
app.use('/client/tickets', ClientTicketRoute);
app.use('/client/messages', ClientMessageRoute);
app.use('/client/chats', ClientChatRoute);
app.use('/client/chat-history', ClientChatHistoryRoute);
app.use('/client/calendar-availabilities', ClientCalendarAvailabilityRoute);

// Advisor Api Routes

const AdvisorAuthRoute = require('./Routes/Advisor/Auth.route');
const AdvisorTicketRoute = require('./Routes/Advisor/Ticket.route');
const AdvisorRoute = require('./Routes/Advisor/Advisor.route');
const AdvisorServiceRoute = require('./Routes/Advisor/Service.route');
const AdvisorMessageRoute = require('./Routes/Advisor/Message.route');
const AdvisorChatRoute = require('./Routes/Advisor/Chat.route');
const AdvisorPaymentRoute = require('./Routes/Advisor/Payment.route');
const AdvisorNotesRoute = require('./Routes/Advisor/AdvisorNotes.route');
const AdvisorChatHistoryRoute = require('./Routes/Advisor/ChatHistory.route');
const AdvisorCalendarAvailabilityRoute = require('./Routes/Advisor/CalendarAvailability.route');

app.use('/advisor', AdvisorRoute);
app.use('/advisor/auth', AdvisorAuthRoute);
app.use('/advisor/tickets', AdvisorTicketRoute);
app.use('/advisor/services', AdvisorServiceRoute);
app.use('/advisor/messages', AdvisorMessageRoute);
app.use('/advisor/chats', AdvisorChatRoute);
app.use('/advisor/payments', AdvisorPaymentRoute);
app.use('/advisor/notes', AdvisorNotesRoute);
app.use('/advisor/chat-history', AdvisorChatHistoryRoute);
app.use('/advisor/calendar-availabilities', AdvisorCalendarAvailabilityRoute);

// Frontend Api Routes

const FrontendRoutes = require('./Routes/Frontend/Index.route');
const FrontendEnquiryRoutes = require('./Routes/Frontend/Enquiry.route');
const FrontendClientAgreementRoute = require('./Routes/Frontend/ClientAgreement.route');
const FrontendAdvisorAgreementRoute = require('./Routes/Frontend/AdvisorAgreement.route');
const FrontendTicketRoute = require('./Routes/Frontend/Ticket.route');
const chatmessage = require('./Routes/Message.route');

var oneWeek = 86400000 * 7;
app.use("/uploads/", express.static(path.join(__dirname, "uploads"), { maxAge: oneWeek, lastModified: true }));


app.use('/frontend', FrontendRoutes);
app.use('/frontend/enqueries', FrontendEnquiryRoutes);
app.use('/frontend/advisor-agreement', FrontendAdvisorAgreementRoute);
app.use('/frontend/client-agreement', FrontendClientAgreementRoute);
app.use('/frontend/tickets', FrontendTicketRoute);

const NotificationRoutes = require('./Routes/Notification.route');
app.use('/notifications', NotificationRoutes);

app.use('/chat', chatmessage);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running on port! ", process.env.PORT);
});


let roomId = '';
let advisor_room = '';
global.onlineUsers = new Map();

io.on("connection", (socket) => {

  io.emit('connect_notify', 'connected');

  socket.on('JOIN_ROOM', ({ room, user }) => {
    roomId = room;
    onlineUsers.set(user, socket.id);
    socket.join(room);
  });

  socket.on('notify', (msg) => {
    console.log(onlineUsers);
    console.log(onlineUsers.size);
    io.to(msg).emit('notifyback', onlineUsers.size);
  });

  socket.on('NEW_MESSAGE', (msg) => {
    io.to(roomId).emit('RECIEVE_MESSAGE', msg);
  });

  socket.on('CHAT-INITIATE', ({ room, user1, user2 }) => {
    io.to(room).emit('CHAT-START', ({ user1, user2 }));
  })

  socket.on('typing', ({ room, type }) => {
    io.to(room).emit('typingnotify', type);
  });

  socket.on("upload", ({ file, name }, callback) => {
    // save the content to the disk, for example
    var folder = __dirname + '/uploads/chat/' + name;

    writeFile(folder, file, (err) => {
      callback({ message: err ? err : "success" });
    });
  });

  socket.on('leave-chat', ({ room , advisor , client }) => {
    global.onlineUsers = new Map();
    var today = new Date();
    var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
    io.to(room).emit('send-chat-log',  ({ room , advisor  ,client ,time }));
    setTimeout(() => {
      io.to(room).emit('leave-chat-notify', ({ room , advisor  ,client ,time }));
    },2000);
    
  });
  
  socket.on('TIMER-CHAT-END', room => {
    io.to(room).emit('timer-chat-notify', 'end');
  });
  
  socket.on('NOTIFICATION-SEND', ({ advisor , client  , noti_id , cl_name}) => {
    io.emit('NOTIFICATION-SEND-TO-ADVISOR', ({ advisor , client , noti_id, cl_name }));
    io.emit('NOTIFICATION-SEND-CHATROOM', ({ advisor , client }));
  });

  socket.on('NOTIFICATION-PAYMENT-ALERT-SEND', data => {
    io.emit('NPASTOADVISOR', data);
  });

  socket.on('CLIENT-CHAT-REJECTED', data => {
    io.emit('CLIENT-CHAT-REJECTED-NOTIFYBACK', data);
  });

  socket.on('acceptRate', ({ room, advisor , client , amount, rate}) => {
    io.to(room).emit('RATE-ACCEPTED', ({ advisor , client, amount , rate }));
  });

  socket.on('free-minutes', ({ room, client , amount , timer }) => {
    var totalAmount = parseFloat(amount)+parseFloat(timer);
    console.log("TotalAmount.................................",totalAmount);
    io.to(room).emit('FREE-MINUTE-ACCEPTED', ({ client, totalAmount }));
  });

  socket.on('alert-to-advisor-payment', data => {
    io.emit('ALERT-CHAT-EXTEND-NOTIFYBACK', data);
  });

  socket.on('NOTIFICATION-PAYMENT-COMPLETE-SEND', ({ advisor , client , room }) => {
    io.emit('NOTIFICATION-AD-PAYMENT-COMP-NOTIFY', ({ advisor , client }));
    io.to(room).emit('NOTIFICATION-PAYMENT-COMP-NOTIFY', ({ advisor , client , room}));
  });
  
});

//404 handler and pass to error handler
app.use((req, res, next) => {
  next(createError(404, 'Not found'));
});

//Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message
    }
  });
});






