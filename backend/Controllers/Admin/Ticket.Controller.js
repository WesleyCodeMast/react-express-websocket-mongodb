const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Ticket = require('../../Models/Ticket.model');
const path = require('path')
const ejs = require('ejs');
var absoluteBasePath = path.resolve('');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const Nodemailer = require('../../Utils/Nodemailer')
const Notification = require('../../Models/Notification.model');
const sendClientNotification = require('../../Utils/sendClientNotification');
const GlobalSetting = require('../../Models/GlobalSetting.model');

module.exports = {
  getAllTickets: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Ticket.countDocuments();

      Ticket.find({}, {__v: 0, updatedAt: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 });
    } catch (error) {
      console.log(error.message);
    }
  },

  getTickets: async (req, res, next) => {
    try {

      Ticket.find({}, {__v:0, updatedAt: 0}, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data};
          }
          res.json(response);
        }).sort({ $natural: -1 });
    } catch (error) {
      console.log(error.message);
    }
  },

  findTicketById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await Ticket.findById(id,{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'Ticket does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Ticket id'));
        return;
      }
      next(error);
    }
  },

  createNewTicket: async (req, res, next) => {

    let rules = {
      issue: 'required',
      solution: 'required',
      email: 'required',
    };

    await validator(req.body, rules, {}, (err, status) => {
      if (!status) {
        res.status(412)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        });
      }
    }).catch( err => console.log(err))

    try {
      const ticket = new Ticket(req.body);
      const result = await ticket.save();
      res.send({
        success: true,
        message: 'Data inserted',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error.name === 'ValidationError') {
        next(createError(422, error.message));
        return;
      }
      next(error);
    }
  },

  updateTicket: async (req, res, next) => {
    try {
      const id = req.params.id;

      const ticket = await Ticket.findById(id);


      if (ticket.user_type == 'advisor') {
        var user = await AdvisorAuth.findById(ticket.advisor_id);
      }else{
        var user = await ClientAuth.findById(ticket.client_id);
      }

      const sender_id = req.user.id;
      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;

      const html = await ejs.renderFile(absoluteBasePath+"/views/admin_to_customer_notification.ejs", { logo:logo,customer: ticket.name, notice: req.body.solution});

        await Nodemailer.sendNotificationToCustomerByAdmin(
          ticket.name,
          ticket.email,
          html
          );     

      /*await sendClientNotification.sendNotification(
        user.name,
        user.email,
        req.body.solution
      );*/

      /* code for sending notification*/

     /* const notifications = {
        sender_id: sender_id,
        reciver_id: user._id,
        from: 'admin',
        to: ticket.user_type,
        notification: req.body.notification,
        type:'ticket',
        advisor: user._id,      
        admin: sender_id,        
      }

      const notification = new Notification(notifications);
      const notification_result = await notification.save();*/

      /* end code for sending notification*/


      const updates = req.body;
      const options = { new: true };

      const result = await Ticket.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Ticket does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Ticket Id'));
      }

      next(error);
    }
  },

  deleteTicket: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Ticket.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Ticket does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Ticket id'));
        return;
      }
      next(error);
    }
  }
};