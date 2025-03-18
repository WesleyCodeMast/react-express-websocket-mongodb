const createError = require('http-errors');
const mongoose = require('mongoose');

const asyncHandler = require('../../Middleware/asyncHandler')

const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const KeyNotes = require('../../Models/Advisor/KeyNotes.model');

module.exports = {

  getAllClients: asyncHandler(async (req, res, next) => {

    var page = parseInt(req.query.page) || 1;
    var size = parseInt(req.query.size) || 15;

     const filter_name = req.query.filter_name
        ? {
          username: {
            $regex: req.query.filter_name,
            $options: "i",
          },
        }
        : {};

      const filter_id = req.query.filter_id
        ? {
          _id: mongoose.Types.ObjectId(req.query.filter_id),
        }
        : {};


    var totalPosts =  await AdvisorAuth.findById(req.user.id,{clients: 1})
    .populate({
      path: 'clients',
      match:{
        ...filter_name, ...filter_id
      }
    });

    AdvisorAuth.findById(req.user.id,{clients : 1})
    .populate({
      path: 'clients',
      select: 'name username avatar email mobile createdAt',
      perDocumentLimit: size,
      options: {
        sort:{ $natural: -1 },
        skip: size * (page - 1),
      },
      match:{
        ...filter_name, ...filter_id
        }
    }).exec((err, result)=>{
      if (err) {
        response = { "error": true, "message": "Error fetching data" + err };
      } else {
        response = { "success": true, "message": 'data fetched', 'data': result.clients, 'page': page, 'total': totalPosts.clients.length, perPage: size };
      }
      res.json(response);
    });

  }),


  getAllOnlineAdvisors: asyncHandler(async (req, res, next) => {

    
    AdvisorAuth.find({ chat_status: 1 }, { name: 1, username: 1, email: 1 },
      function (err, data) {
        if (err) {
          response = { "error": true, "message": "Error fetching data" + err };
        } else {
          response = { "success": true, "message": 'data fetched', 'data': data };
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),

  findClientById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await ClientAuth.findById(id, { __v: 0, confirmationCode: 0, tokens: 0, updatedAt: 0 });
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      const keynotes = await KeyNotes.find({ advisor_id: id, client_id: id, status: 1 });
      new ObjectID(id)
      res.json({
        success: true,
        message: 'Data fetched!',
        data: auth
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  deleteClient: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await ClientAuth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Client does not exist.');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Client id'));
        return;
      }
      next(error);
    }
  },

  updateClient: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await ClientAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Client does not exist');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Client Id'));
      }
      next(error);
    }
  },

};