const createError = require('http-errors');
const mongoose = require('mongoose');

const asyncHandler = require('../../Middleware/asyncHandler');
const ClientAuth = require('../../Models/Client/Auth.model');
const Promotion = require('../../Models/Promotion.model');

module.exports = {

  getClient: async (req, res, next) => {
    try {

      const id = req.params.id;
      const result = await ClientAuth.findById(id, { password: 0, tickets: 0, __v: 0, tokens: 0, confirmationCode: 0 });

      const promotion = await Promotion.find({ client: id });

      if(result) {
        res.send({
          success: true,
          message: 'user fetched!',
          data: {result: result, promotion:promotion},

        });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  getClientt: async (req, res, next) => {
    try {

      const client_id = req.params.client_id;
      const advisor_id = req.params.advisor_id;

      const result = await ClientAuth.find({ _id: client_id }, { password: 0, tickets: 0, __v: 0, tokens: 0, confirmationCode: 0 });

      const promotion = await Promotion.find({ client: client_id , advisor: advisor_id });

      if(result) {
        res.send({
          success: true,
          message: 'user fetched!',
          data: {result: result, promotion:promotion},

        });
      }
    } catch (error) {
      console.log("Error",error.message);
    }
  },

  updateClientOnlineStatus: async (req, res, next) => {
    try {

      const client_id = req.body.client_id;
      const online_status = req.body.online_status;

      const result = await ClientAuth.updateOne({_id: client_id}, { $set: { online_status: online_status }});

      if(result) {
        res.send({
          success: true,
          message: 'user updated!',
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  getClientOnlineStatus: async (req, res, next) => {
    try {

      const client_id = req.params.id;

      const result = await ClientAuth.findById(client_id);

      if(result) {
        res.send({
          success: true,
          message: 'user fetched!',
          online_status: result.online_status,
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  }

};
