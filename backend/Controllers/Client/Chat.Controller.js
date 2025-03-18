const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Chat = require('../../Models/Chat.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {
  getAllChats: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      console.log('use id',req.user.id);

      var totalPosts = await Chat.countDocuments({$or:[{"message_from":'client'}, {"message_to":'client'} ,{"sender":req.user.id}, {"reciver":req.user.id}]});

      Chat.find({$or:[{"message_from":'client'}, {"message_to":'client'} ,{"sender":req.user.id}, {"reciver":req.user.id}]}, {__v: 0, updatedAt: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('advisor', 'name email mobile').populate('client','name email mobile');
    } catch (error) {
      console.log(error.message);
    }
  },

  getChats: async (req, res, next) => {
    try {

      Chat.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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

  findChatById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await Chat.findById(id,{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'Chat does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Chat id'));
        return;
      }
      next(error);
    }
  },

  createNewChat: async (req, res, next) => {

    let rules = {
      message: 'required',
      advisor_id: 'required',
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
      req.body.sender = client._id;
      req.body.reciver = req.body.advisor_id;
      req.body.client = client._id;
      req.body.advisor = req.body.advisor_id;
      req.body.sender_reseptent = client._id+'_'+req.body.advisor_id;
      req.body.message_from = 'client';
      req.body.message_to = 'advisor';
      req.body.users = [client._id, req.body.advisor_id];
      const message = new Chat(req.body);
      const result = await message.save();

      client.advisors.pull(req.body.advisor_id);
      await client.save();

      client.advisors.push(req.body.advisor_id);
      await client.save();

      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

      advisor.clients.pull(client._id);
      await advisor.save();

      advisor.clients.push(client._id);
      await advisor.save();

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

  updateChat: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await Chat.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Chat does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Chat Id'));
      }

      next(error);
    }
  },

  deleteChat: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Chat.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Chat does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Chat id'));
        return;
      }
      next(error);
    }
  }
};