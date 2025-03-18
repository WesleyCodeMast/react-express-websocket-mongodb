const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const ChatHistory = require('../../Models/Chat.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {

  getAllChatClients: async (req, res, next) => {

    try {

      const filter_name = req.query.filter_name
        ? {
          name: {
            $regex: req.query.filter_name,
            $options: "i",
          },
        }
        : {};

      AdvisorAuth.findById(req.user.id, {clients: 1},
        function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate({path: 'clients', select: 'name email mobile', match: { ...filter_name }});
    } catch (error) {
      console.log(error.message);
    }
  },

  getAllChatHistorys: async (req, res, next) => {

    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await ChatHistory.countDocuments({$or:[{"message_from":'advisor'} ,{"message_to":'advisor'}, {"reciver":req.user.id}, {"sender":req.user.id}]});

      ChatHistory.find({$or:[{"message_from":'advisor'} ,{"message_to":'advisor'}, {"reciver":req.user.id}, {"sender":req.user.id}]}, {__v: 0, updatedAt: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('client', 'name email mobile').populate('advisor','name email mobile');
    } catch (error) {
      console.log(error.message);
    }
  },

  getChatHistorys: async (req, res, next) => {
    try {

      ChatHistory.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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

  findChatHistoryById: async (req, res, next) => {
    const advisor_id = req.user.id;
    const client_id = req.params.id;

    const firstData = await ChatHistory.findOne({$or:[{sender_reseptent: advisor_id+'_'+client_id}, {sender_reseptent: client_id+'_'+advisor_id}]}).sort({$natural: -1}).limit(1);
      const lastData = await ChatHistory.findOne({$or:[{sender_reseptent: advisor_id+'_'+client_id}, {sender_reseptent: client_id+'_'+advisor_id}]}).sort({$natural: 1}).limit(1);

      var valuestop = firstData.createdAt.toLocaleTimeString();
      var valuestart = lastData.createdAt.toLocaleTimeString();

      var timeStart = new Date("01/01/2007 " + valuestart).getMinutes();
      var timeEnd = new Date("01/01/2007 " + valuestop).getMinutes();

      var timeStartH = new Date("01/01/2007 " + valuestart).getHours();
      var timeEndH = new Date("01/01/2007 " + valuestop).getHours();

      var timeStartS = new Date("01/01/2007 " + valuestart).getSeconds();
      var timeEndS = new Date("01/01/2007 " + valuestop).getSeconds();

      var minDiff = await (timeEnd - timeStart);  
      var hourDiff = await (timeEndH - timeStartH);  
      var secDiff = await (timeEndS - timeStartS);  

      if (minDiff < 0) {
        minDiff = 60+parseInt(minDiff)
      }
      if (secDiff < 0) {
        secDiff = 60+parseInt(secDiff)
      }

      const chatTime = await (hourDiff+':'+minDiff+':'+secDiff);

    try {
      const chat = await ChatHistory.find({$or:[{sender_reseptent: advisor_id+'_'+client_id}, {sender_reseptent: client_id+'_'+advisor_id}]},{__v: 0, updatedAt: 0, users: 0}).populate('advisor', 'name username email').populate('client', 'name username email');
      if (!chat) {
        throw createError(404, 'ChatHistory does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: chat,
        chat_time: chatTime
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid ChatHistory id'));
        return;
      }
      next(error);
    }
  },

  createNewChatHistory: async (req, res, next) => {

    let rules = {
      message: 'required',
      client_id: 'required',
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
      req.body.sender = advisor._id;
      req.body.advisor = advisor._id;
      req.body.reciver = req.body.client_id;
      req.body.client = req.body.client_id;
      req.body.message_from = 'advisor';
      req.body.sender_reseptent = advisor._id+'_'+req.body.client_id;
      req.body.message_to = 'client';
      req.body.users = [advisor._id, req.body.client_id];
      const message = new ChatHistory(req.body);
      const result = await message.save();

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

  updateChatHistory: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await ChatHistory.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'ChatHistory does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid ChatHistory Id'));
      }

      next(error);
    }
  },

  deleteChatHistory: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await ChatHistory.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'ChatHistory does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid ChatHistory id'));
        return;
      }
      next(error);
    }
  }
};