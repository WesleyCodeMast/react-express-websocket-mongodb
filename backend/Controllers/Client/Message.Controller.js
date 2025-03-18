const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');
var ejs = require("ejs");
const path = require('path')
const Message = require('../../Models/Message.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const Nodemailer = require('../../Utils/Nodemailer')
const GlobalSetting = require('../../Models/GlobalSetting.model');


module.exports = {

  getAllMessageAdvisors: async (req, res, next) => {

    try {

      const filter_name = req.query.filter_name
      ? {
        name: {
          $regex: req.query.filter_name,
          $options: "i",
        },
      }
      : {};

      const advisorClients = await ClientAuth.findById(req.user.id, {advisors: 1}).sort({ $natural: -1 }).populate({path: 'advisors', select: 'name username avatar email mobile createdAt', match: { ...filter_name }});
      if (!advisorClients) {
        response = { "error": true, "message": "Error fetching data" + err };
      } else {

        let CategoryList = [];

        for (let advisorClient of advisorClients.advisors) {

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
          lastMessage: created_at ?? advisorClient.createdAt,
          created_at: advisorClient.createdAt,
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
      
      var totalPosts = await Message.countDocuments({$or:[{"message_from":'client'}, {"message_to":'client'} ,{"sender":req.user.id}, {"reciver":req.user.id}]});

      Message.find({$or:[{"message_from":'client'}, {"message_to":'client'} ,{"sender":req.user.id}, {"reciver":req.user.id}]}, {__v: 0, updatedAt: 0},
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
    const advisor_id = req.params.id;
    const client_id = req.user.id;
    try {

    const message = await Message.find({
          $and: [
              {
                  $or: [{sender_reseptent:client_id+'_'+advisor_id}, {sender_reseptent:advisor_id+'_'+client_id}]
              },
              {
                  "type": "chat"
              }
          ]
      }).sort({$natural: -1});;

      // const message = await Message.find({$and : [$or:  ]},{__v: 0, updatedAt: 0});
      if (!message) {
        throw createError(404, 'Message does not exist.');
      }
      const updateMessage = await Message.updateMany({$or: [{sender_reseptent:client_id+'_'+advisor_id}, {sender_reseptent:advisor_id+'_'+client_id}]},{$set : {is_read : 1}});

      const messageLat = await Message.find({
          $and: [
              {
                  $or: [{sender_reseptent:client_id+'_'+advisor_id}, {sender_reseptent:advisor_id+'_'+client_id}]
              },
              {
                  "type": "chat"
              }
          ]
      }).sort({$natural: -1}).limit(2);

      var count = 0;

      for (let result of messageLat) {
        if (result.message_from == 'client') {
          count++;
        }
      }
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
      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

      
      
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
      req.body.sender = client._id;
      req.body.reciver = req.body.advisor_id;
      req.body.client = client._id;
      req.body.advisor = req.body.advisor_id;
      req.body.sender_reseptent = client._id+'_'+req.body.advisor_id;
      req.body.message_from = 'client';
      req.body.message_to = 'advisor';
      req.body.users = [client._id, req.body.advisor_id];
      const message = new Message(req.body);
      const result = await message.save();
      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;

      var absoluteBasePath = path.resolve('');

      const htmlAdvisor = await ejs.renderFile(absoluteBasePath+"/views/inbox_message.ejs", {logo:logo,name: advisor.username, client: client.username, client_email: client.email, message: req.body.message });

      Nodemailer.sendInboxMessageNotification(
        advisor.username,
        advisor.email,
        client.username,
        client.email,
        htmlAdvisor
      );

      client.advisors.pull(req.body.advisor_id);
      await client.save();

      client.advisors.push(req.body.advisor_id);
      await client.save();

      advisor.clients.pull(client._id);
      await advisor.save();

      advisor.clients.push(client._id);
      await advisor.save();

      const messageLat = await Message.find({
          $and: [
              {
                  $or: [{sender_reseptent:client.id+'_'+advisor.id}, {sender_reseptent:advisor.id+'_'+client.id}]
              },
              {
                  "type": "chat"
              }
          ]
      }).sort({$natural: -1}).limit(2);

      var count = 0;

      for (let result of messageLat) {
        if (result.message_from == 'client') {
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