const createError = require('http-errors');
const mongoose = require('mongoose');

const asyncHandler = require('../../Middleware/asyncHandler')

const ClientAuth = require('../../Models/Client/Auth.model');
const CalendarBooking = require('../../Models/CalendarBooking.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {

  getAllClients: asyncHandler(async (req, res, next) => {

    const filter_created_at = req.query.filter_created_at
      ? {
        addedAt: {
          $regex: req.query.filter_created_at
        }
      }
      : {};

    const filter_name = req.query.filter_name
      ? {
        name: {
          $regex: req.query.filter_name,
          $options: "i",
        },
      }
      : {};

    const filter_email = req.query.filter_email
      ? {
        email: {
          $regex: req.query.filter_email,
          $options: "i",
        },
      }
      : {};

    const filter_mobile = req.query.filter_mobile
      ? {
        mobile: {
          $regex: req.query.filter_mobile,
          $options: "i",
        }
      }
      : {};

    const filter_status = req.query.filter_status
      ? {
        status: req.query.filter_status
      }
      : {};

    var page = parseInt(req.query.page) || 1;
    var size = parseInt(req.query.size) || 15;

    var query = {}

    query.skip = size * (page - 1);
    query.limit = size;

    var totalPosts = await ClientAuth.find({ ...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name }).countDocuments().exec();

    ClientAuth.find({ ...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name }, { __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0 },
      query, function (err, data) {
        if (err) {
          response = { "error": true, "message": "Error fetching data" + err };
        } else {
          response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),


  getAllOnlineAdvisors: asyncHandler(async (req, res, next) => {

    
    AdvisorAuth.find({ chat_status: 1 }, { name: 1, username: 1, email: 1 },
      function (err, data) {
        if (err) {
          response = { "error": true, "message": "Error fetching data" + err };
        } else {
          response = { "success": true, "message": 'data fetched', 'data': data };
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),


  getAllBookingNotifications: asyncHandler(async (req, res, next) => {

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;

    // date: today
    const data =  await CalendarBooking.find({ client: req.user.id, date: { $regex : today} }, { __v: 0 }).sort({$natural: -1});
    if (!data) {
      return res.json({ "error": true, "message": "Error fetching data" + err });
    } else {

      const advisorsData = [];

      for (let result of data) {
        const intervals = result.intervals.sort();

        for (let interval of intervals) {

          const intervalS = interval.split(' - ')[0];
          const intervalS1 = interval.split(' - ')[1];
          var now = new Date();
          now.setMinutes(now.getMinutes() + 15);
          now = new Date(now);

          var now1 = new Date();
          now1.setMinutes(now1.getMinutes() + 30);
          now1 = new Date(now1);

          var timeNew = now.getHours().toString().padStart(2, '0') +':'+now.getMinutes().toString().padStart(2, '0');
          var timeNew1 = now1.getHours().toString().padStart(2, '0') +':'+now1.getMinutes().toString().padStart(2, '0');

          if ((intervalS >= timeNew  && intervalS <= timeNew1) || (intervalS1 >= timeNew  && intervalS1 <= timeNew1) ) {
            const advisor =  await AdvisorAuth.findOne({_id: result.advisor, chat_status : 1});
            if (advisor) {
              const newItem = advisor.username;

              var index = advisorsData.findIndex(x => x.id == advisor.id); 

              index === -1 ? advisorsData.push({id: advisor.id, name: newItem, time: (intervalS ?? intervalS1)}) : console.log("This item already exists");
            }
          }
        }
      }

      const auth = await ClientAuth.findById(req.user.id);
      auth.booking_notification_count = advisorsData.length;
      await auth.save();

      res.json({ "success": true, "message": 'data fetched', 'data': data, advisors: advisorsData });
    }
  }),

  
  updateChatEngage_Status: async (req, res, next) => {
    try {
      const id = req.body.advisor_id

      const updates = req.body;
      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }
      
      return res.send({
        success: true,
        message: 'Chat Engage status updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  findClientById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await ClientAuth.findById(id, { __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0 });
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send(auth);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  deleteClient: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await ClientAuth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Client does not exist.');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Client id'));
        return;
      }
      next(error);
    }
  },

  updateClient: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await ClientAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Client does not exist');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Client Id'));
      }
      next(error);
    }
  },

  updateChat_Status: async (req, res, next) => {
    try {
      const id = req.body.client_id

      const updates = req.body;
      const options = { new: true };

      const result = await ClientAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Client does not exist');
      }
      
      return res.send({
        success: true,
        message: 'Chat Status has been updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid CLient Id'));
      }
      next(error);
    }
  },


  getStatusChatca: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await ClientAuth.findById(id, { chat_status: 1 });
      if (!auth) {
        throw createError(201, 'Client does not exist.');
      }
      res.send(auth);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Client id'));
        return;
      }
      next(error);
    }
  },


};