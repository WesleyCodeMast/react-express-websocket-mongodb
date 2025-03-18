const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../helpers/validate');

const Notification = require('../Models/Notification.model');
const ClientAuth = require('../Models/Client/Auth.model');
const AdvisorAuth = require('../Models/Advisor/Auth.model');

module.exports = {
  getAllNotifications: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Notification.countDocuments();

      Notification.find({}, {__v: 0, updatedAt: 0},
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

  getClientNotifications: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      const client_id = req.user.id;

      var totalPosts = await Notification.countDocuments({to: 'client', reciver_id: client_id});

      Notification.find({to: 'client', reciver_id: client_id}, {__v: 0, updatedAt: 0},
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

  getAdvisorNotifications: async (req, res, next) => {
    try {
      const advisor_id = req.user.id;

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Notification.countDocuments({to: 'advisor', reciver_id: advisor_id});

      Notification.find({to: 'advisor', reciver_id: advisor_id}, {__v: 0, updatedAt: 0},
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

  getNotifications: async (req, res, next) => {
    try {

      Notification.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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

  findNotificationById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await Notification.findById(id,{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'Notification does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Notification id'));
        return;
      }
      next(error);
    }
  },

  createNewNotification: async (req, res, next) => {

    let rules = {
      notification: 'required'
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
      const notification = new Notification(req.body);
      const result = await notification.save();
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

  createAdvisorNotification: async (req, res, next) => {

    let rules = {
      advisor_id: 'required'
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

      const client = await ClientAuth.findById(req.user.id);

      const notifications = {
        sender_id: req.user.id,
        reciver_id: req.body.advisor_id,
        from: 'client',
        to: 'advisor',
        notification: client.name+' want to chat with you',
        type:'chat',
        advisor: req.body.advisor_id,      
        client: req.user.id,      
      }

      const notification = new Notification(notifications);
      const result = await notification.save();
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

  createClientNotification: async (req, res, next) => {

    let rules = {
      client_id: 'required'
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

      const advisor = await AdvisorAuth.findById(req.user.id);

      const notifications = {
        sender_id: req.user.id,
        reciver_id: req.body.client_id,
        from: 'advisor',
        to: 'client',
        notification: advisor.name+' rejected you chat request',
        type:'chat',
        advisor: req.user.id,      
        client: req.body.client_id,      
      }

      const notification = new Notification(notifications);
      const result = await notification.save();
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

  updateNotification: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await Notification.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Notification does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Notification Id'));
      }

      next(error);
    }
  },

  deleteNotification: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Notification.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Notification does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Notification id'));
        return;
      }
      next(error);
    }
  }
};