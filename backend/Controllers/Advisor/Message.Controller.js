const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Message = require('../../Models/Message.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const ClientAuth = require('../../Models/Client/Auth.model');

module.exports = {

  getAllMessageClients: async (req, res, next) => {

    try {

      const filter_name = req.query.filter_name
      ? {
        name: {
          $regex: req.query.filter_name,
          $options: "i",
        },
      }
      : {};

      const advisorClients = await AdvisorAuth.findById(req.user.id, {clients: 1}).sort({ $natural: -1 }).populate({path: 'clients', select: 'name username avatar email mobile', match: { ...filter_name }});
      if (!advisorClients) {
        response = { "error": true, "message": "Error fetching data" + err };
      } else {

        let CategoryList = [];

        for (let advisorClient of advisorClients.clients) {

          const unreadMessages = await Message.countDocuments({ $and: [{"sender_reseptent":advisorClient.id+'_'+req.user.id},{"is_read": 0}]});
          const unreadMessage = await Message.findOne({ $and: [{"sender_reseptent":advisorClient.id+'_'+req.user.id},{"is_read": 0}]}).sort({$natural:-1});

          let created_at = '';

          if (unreadMessage && unreadMessage !== null && unreadMessage !== 'null') {
            created_at = unreadMessage.createdAt.toLocaleString();
          }

         CategoryList.push({
          _id: advisorClient._id,
          name: advisorClient.name,
          username: advisorClient.username,
          avatar: advisorClient.avatar,
          email: advisorClient.email,
          mobile: advisorClient.mobile,
          unread_messages: unreadMessages,
          lastMessage: created_at,
        })
       }

        response = { "success": true, "message": 'data fetched', 'data': CategoryList };
      }
      res.json(response);
    } catch (error) {
      console.log(error.message);
    }
  },

  getAllMessages: async (req, res, next) => {

    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Message.countDocuments({$or:[{"message_from":'advisor'} ,{"message_to":'advisor'}, {"reciver":req.user.id}, {"sender":req.user.id}]});

      Message.find({$or:[{"message_from":'advisor'} ,{"message_to":'advisor'}, {"reciver":req.user.id}, {"sender":req.user.id}]}, {__v: 0, updatedAt: 0},
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

  getMessages: async (req, res, next) => {
    try {

      Message.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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

  findMessageById: async (req, res, next) => {
    const client_id = req.params.id;
    const advisor_id = req.user.id;
    try {
      const message = await Message.find({$or: [{sender_reseptent:advisor_id+'_'+client_id}, {sender_reseptent:client_id+'_'+advisor_id}]},{__v: 0, updatedAt: 0}).sort({$natural: -1});
      const messageLat = await Message.find({$or: [{sender_reseptent:advisor_id+'_'+client_id}, {sender_reseptent:client_id+'_'+advisor_id}]},{message_from: 1, message: 1}).sort({$natural: -1}).limit(2);

      var count = 0;

      for (let result of messageLat) {
        if (result.message_from == 'advisor') {
          count++;
        }
      }

      if (!message) {
        throw createError(404, 'Message does not exist.');
      }
      const updateMessage = await Message.updateMany({$or: [{sender_reseptent:advisor_id+'_'+client_id}, {sender_reseptent:client_id+'_'+advisor_id}]},{$set: {is_read: 1}});
      res.send({
        success: true,
        message: 'Data fetched',
        data: message,
        count
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Message id'));
        return;
      }
      next(error);
    }
  },

  createNewMessage: async (req, res, next) => {

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
      
      var new_files = [];

      if(req.files){

        for (var i = 0, f; f = req.files[i]; i++) {
          new_files.push({
            file: req.files[i].path,
            doc_type: req.files[i].mimetype,
          });

        }
      }
      
      req.body.files = new_files;
      req.body.sender = advisor._id;
      req.body.advisor = advisor._id;
      req.body.reciver = req.body.client_id;
      req.body.client = req.body.client_id;
      req.body.message_from = 'advisor';
      req.body.sender_reseptent = advisor._id+'_'+req.body.client_id;
      req.body.message_to = 'client';
      req.body.users = [advisor._id, req.body.client_id];
      const message = new Message(req.body);
      const result = await message.save();

      advisor.clients.pull(req.body.client_id);
      await advisor.save();

      advisor.clients.push(req.body.client_id);
      await advisor.save();

      const client = await ClientAuth.findById(req.body.client_id);
      
      client.advisors.pull(advisor._id);
      await client.save();

      client.advisors.push(advisor._id);
      await client.save();


      const messageLat = await Message.find({$or: [{sender_reseptent:advisor.id+'_'+client.id}, {sender_reseptent:client.id+'_'+advisor.id}]},{message_from: 1, message: 1}).sort({$natural: -1}).limit(2);

      var count = 0;

      for (let result of messageLat) {
        if (result.message_from == 'advisor') {
          count++;
        }
      }

      res.send({
        success: true,
        message: 'Data inserted',
        data: result,
        count
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

  updateMessage: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await Message.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Message does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Message Id'));
      }

      next(error);
    }
  },

  deleteMessage: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Message.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Message does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Message id'));
        return;
      }
      next(error);
    }
  }
};