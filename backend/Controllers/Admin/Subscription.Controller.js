const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Subscription = require('../../Models/Subscription.model');

module.exports = {
  getAllSubscriptions: async (req, res, next) => {
    try {

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

    const filter_username = req.query.filter_username
        ? {
          username: {
            $regex: req.query.filter_username,
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

      var totalPosts = await Subscription.find({...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name, ...filter_username}).countDocuments().exec();

      Subscription.find({...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name, ...filter_username}, {__v: 0, updatedAt: 0},
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


  findSubscriptionById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await Subscription.findById(id,{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'Subscription does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Subscription id'));
        return;
      }
      next(error);
    }
  },

  createNewSubscription: async (req, res, next) => {

    let rules = {
      keyword: 'required'
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
      const keyword = new Subscription(req.body);
      const result = await keyword.save();
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

  updateSubscription: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await Subscription.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Subscription does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Subscription Id'));
      }

      next(error);
    }
  },

  deleteSubscription: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Subscription.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Subscription does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Subscription id'));
        return;
      }
      next(error);
    }
  }
};