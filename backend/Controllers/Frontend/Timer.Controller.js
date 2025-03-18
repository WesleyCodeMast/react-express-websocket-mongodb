const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Timer = require('../../Models/Timer.model');


async function checkDataExists(client, advisor) {

  totalPosts = await Timer.countDocuments({ client: client, advisor: advisor });
  if (totalPosts > 0) {
    return true;
  } else {
    return false;
  }
};


module.exports = {
  getAllTimers: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Timer.countDocuments();

      Timer.find({}, {__v: 0, updatedAt: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('client', 'username email mobile').populate('advisor','username email mobile');;
    } catch (error) {
      console.log(error.message);
    }
  },

  getTimers: async (req, res, next) => {
    try {

      Timer.find({}, {__v:0, updatedAt: 0}, function (err, data) {

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

  findTimerById: async (req, res, next) => {
    const client = req.params.client_id;
    const advisor = req.params.advisor_id;
    try {
      const review = await Timer.findOne({client: client, advisor: advisor}, {__v: 0, updatedAt: 0}).populate('client', 'username email mobile').populate('advisor','username email mobile');
      if (!review) {
        throw createError(404, 'Timer does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Timer id'));
        return;
      }
      next(error);
    }
  },

  createNewTimer: async (req, res, next) => {

    let rules = {
      advisor_id: 'required',
      client_id: 'required',
      timer: 'required'
    };

    await validator(req.body, rules, {}, (err, status) => {
      if (!status) {
        res.status(200)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        });
      }
    }).catch( err => console.log(err))


    var checkCountEmail = await checkDataExists(req.body.client_id, req.body.advisor_id);

      if (checkCountEmail) {
        return res.status(200)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'Duplicate Data'
        });
      }

    try {

      req.body.client = req.body.client_id;
      req.body.advisor = req.body.advisor_id; 
      const keyword = new Timer(req.body);
      const result = await keyword.save();
      res.send({
        success: true,
        message: 'Data inserted',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error.name === 'ValidationError') {
        next(createError(200, error.message));
        return;
      }
      next(error);
    }
  },

  updateTimer: async (req, res, next) => {

    try {
      const client = req.params.client_id;
      const advisor = req.params.advisor_id;
      const updates = req.body;
      const options = { new: true };

      const result = await Timer.findOneAndUpdate({client: client, advisor: advisor}, updates, options);
      if (!result) {
        throw createError(404, 'Timer does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Timer Id'));
      }

      next(error);
    }
  },

  deleteTimer: async (req, res, next) => {
    const client = req.params.client_id;
    const advisor = req.params.advisor_id;
    try {
      const result = await Timer.deleteMany({client: client, advisor: advisor});
      if (!result) {
        throw createError(404, 'Timer does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Timer id'));
        return;
      }
      next(error);
    }
  }
};