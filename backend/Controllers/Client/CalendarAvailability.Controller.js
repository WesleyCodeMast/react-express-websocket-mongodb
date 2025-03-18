const createError = require('http-errors');
const mongoose = require('mongoose');
const ejs = require('ejs');
const validator = require('../../helpers/validate');
const path = require('path')
const CalendarAvailability = require('../../Models/CalendarAvailability.model');
const CalendarBooking = require('../../Models/CalendarBooking.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const Nodemailer = require('../../Utils/Nodemailer');
const Message = require('../../Models/Message.model');
const GlobalSetting = require('../../Models/GlobalSetting.model');

module.exports = {
  getAllCalendarAvailabilitys: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await CalendarAvailability.countDocuments();

      CalendarAvailability.find({}, {__v: 0, updatedAt: 0},
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

  getCalendarAvailabilitys: async (req, res, next) => {
    try {

      CalendarAvailability.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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

  findCalendarAvailabilityById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const calendar_availability = await CalendarAvailability.findById(id,{__v: 0, updatedAt: 0});
      if (!calendar_availability) {
        throw createError(404, 'CalendarAvailability does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: calendar_availability
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid CalendarAvailability id'));
        return;
      }
      next(error);
    }
  },


  findCalendarAvailabilityByAdvisor: async (req, res, next) => {
    const id = req.params.id;
    try {
      const calendar_availability = await CalendarAvailability.find({advisor: id},{__v: 0, updatedAt: 0}).populate('advisor','username email mobile').populate('client','username email mobile');
      if (!calendar_availability) {
        throw createError(404, 'CalendarAvailability does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: calendar_availability
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid CalendarAvailability id'));
        return;
      }
      next(error);
    }
  },


  findCalendarAvailabilityByDate: async (req, res, next) => {
    
    const date = req.params.date;
    try {
      const calendar_availability = await CalendarAvailability.find({$and: [{ $or : [{datetime_from :  {$regex: date}}, {datetime_to :  {$regex: date}}] }, {advisor : req.query.advisor_id} ] },{__v: 0, updatedAt: 0});
      if (!calendar_availability) {
        throw createError(404, 'CalendarAvailability does not exist.');
      }

      let advisorData = [];

      var arr = [];

      for (let calendar_availabilityData of calendar_availability) {

        var startTime = (calendar_availabilityData.datetime_from);
        var endTime = (calendar_availabilityData.datetime_to);

        var parseIn = function(date_time){
          var d = new Date();
          d.setHours(date_time.substring(11,13));
          d.setMinutes(date_time.substring(14,16));

          return d;
        }

        var getTimeIntervals = function (time1, time2) {

          var interval  = 15
          while(time1 < time2){
            var t1 = time1.toTimeString().substring(0,5);
            time1.setMinutes(time1.getMinutes() + 15);

            var t2 = time1.toTimeString().substring(0,5);

            var newItem = t1 + ' - ' + t2;

            if(arr.indexOf(newItem) === -1)  arr.push(newItem);

          }
          return arr;
        }

        startTime = parseIn(startTime);
        endTime = parseIn(endTime);

        var intervals = getTimeIntervals(startTime, endTime);

      }

      const advisorDataNew =  await  intervals;

      if (intervals && intervals.length > 0) {        
        const advisorDataNew =  await  intervals.sort();
      }


      const calendar_booking = await CalendarBooking.find({date :  {$regex: date}, advisor : req.query.advisor_id },{date: 1, intervals: 1});

      if (calendar_booking) {

        var bookingArray = [];

        for (let calendarBooking of calendar_booking) {

          for (let intervals of calendarBooking.intervals) {

            if(bookingArray.indexOf(intervals) === -1)  bookingArray.push(intervals);
          }
        }
      }

      if (bookingArray && bookingArray.length) {

        for (let bookings of bookingArray) {

          if(advisorDataNew && advisorDataNew.includes(bookings)){ 
            advisorDataNew.splice(advisorDataNew.indexOf(bookings), 1); 
          }
        }
      }

      res.send({
        success: true,
        message: 'Data fetched',
        data: calendar_availability,
        intervals: advisorDataNew,
        bookings: bookingArray
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid CalendarAvailability id'));
        return;
      }
      next(error);
    }
  },

  createNewCalendarAvailability: async (req, res, next) => {

    let rules = {
      datetime_from: 'required',
      datetime_to: 'required',
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

      // await CalendarAvailability.deleteMany({date: req.body.date, time: req.body.time});

      const client = await ClientAuth.findById(req.user._id);
      req.body.client_id = client._id;

      req.body.advisor = req.body.advisor_id;

      const calendar_availability = new CalendarAvailability(req.body);
      const result = await calendar_availability.save();

      result.client = client._id;
      await result.save(); 

      client.calendar_availabilitys.push(result._id);
      await client.save();

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


  createNewCalendarAvailabilityBook: async (req, res, next) => {

    let rules = {
      date: 'required',
      intervals: 'required',
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

      const client = await ClientAuth.findById(req.user._id);

      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

      client.advisors.pull(req.body.advisor_id);
      await client.save();

      client.advisors.push(req.body.advisor_id);
      await client.save();

      advisor.clients.pull(req.user._id);
      await advisor.save();

      advisor.clients.push(req.user._id);
      await advisor.save();

      req.body.advisor = req.body.advisor_id;
      req.body.client = client._id;

      const calendar_availability = new CalendarBooking(req.body);
      const result = await calendar_availability.save();

      const logoData = await GlobalSetting.findOne({});

      const logo = process.env.BASE_URL+'/api/'+logoData.logo;

      var absoluteBasePath = path.resolve('');

      const html = await ejs.renderFile(absoluteBasePath+"/views/booking.ejs", {name: advisor.username, logo:logo,email: advisor.email, client: client.username, client_email: client.email, date: req.body.date, intervals: req.body.intervals});

      await Nodemailer.sendScheduleChatBookingNotification(
        advisor.username,
        advisor.email,
        client.username,
        client.email,
        req.body.date,
        req.body.intervals,
        html
      );

      /*req.body.sender = client._id;
      req.body.reciver = req.body.advisor_id;
      req.body.client = client._id;
      req.body.advisor = req.body.advisor_id;
      req.body.sender_reseptent = client._id+'_'+req.body.advisor_id;
      req.body.message_from = 'client';
      req.body.message_to = 'advisor';
      req.body.message = 'Client : ' + client.name+" give you a Un Happy Face <span style='font-size:12px;'>&#128542;</span> (low) rating, please check this review message and reply him: </br> "+req.body.review;
      req.body.users = [client._id, req.body.advisor_id];
      const message = new Message(req.body);
      const result = await message.save();*/

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

  updateCalendarAvailability: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await CalendarAvailability.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'CalendarAvailability does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid CalendarAvailability Id'));
      }

      next(error);
    }
  },

  deleteCalendarAvailability: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await CalendarAvailability.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'CalendarAvailability does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid CalendarAvailability id'));
        return;
      }
      next(error);
    }
  }
};