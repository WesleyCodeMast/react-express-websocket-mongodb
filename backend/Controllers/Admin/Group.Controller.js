const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Group = require('../../Models/User/Group.model');

module.exports = {
  getAllGroups: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Group.countDocuments();

      Group.find({}, {__v: 0, updatedAt: 0},
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

  getGroups: async (req, res, next) => {
    try {

      Group.find({status:1}, {name:1}, function (err, data) {
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

  findGroupById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await Group.findById(id,{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'Group does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Group id'));
        return;
      }
      next(error);
    }
  },

  createNewGroup: async (req, res, next) => {

    let rules = {
      name: 'required'
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
      const name = new Group(req.body);
      const result = await name.save();
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

  updateGroup: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await Group.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Group does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Group Id'));
      }

      next(error);
    }
  },

  deleteGroup: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Group.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Group does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Group id'));
        return;
      }
      next(error);
    }
  }
};