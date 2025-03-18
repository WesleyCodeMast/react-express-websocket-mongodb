const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const CalendarAvailability = require('../../Models/CalendarAvailability.model');
const CalendarBooking = require('../../Models/CalendarBooking.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {
  getAllCalendarAvailabilitys: async (req, res, next) => {
    try {

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      CalendarAvailability.find({advisor: req.user.id, date: { $gte: today } }, {__v: 0, updatedAt: 0},
        function (err, data) {
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

  getCalendarAvailabilityBooked: async (req, res, next) => {
    try {

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      CalendarBooking.find({advisor: req.user.id, date: { $gte: today }}, {__v:0, updatedAt: 0}, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data};
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('client','name username email mobile').populate('advisor', 'name username email mobile');
    } catch (error) {
      console.log(error.message);
    }
  },

  findCalendarAvailabilityById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await CalendarAvailability.findById(id,{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'CalendarAvailability does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
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

      const advisor = await AdvisorAuth.findById(req.user._id);
      req.body.advisor = advisor._id;
      const avalibity = new CalendarAvailability(req.body);
      const result = await avalibity.save();

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