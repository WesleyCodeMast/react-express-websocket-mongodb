const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const ClientAgreement = require('../../Models/ClientAgreement.model');
const ClientAuth = require('../../Models/Client/Auth.model');

module.exports = {
  getClientAgreement: async (req, res, next) => {
    try {

      const agreement = await ClientAgreement.findOne({}, {__v: 0, updatedAt: 0});
      if (!agreement) {

        const newClientAgreement = {
          agreement: '',
        };

        const agreement = new ClientAgreement(newClientAgreement);
        const agreementResult = await agreement.save();

        response = { "success": true, "message": 'data fetched', 'data': agreementResult };
        res.json(response);
      } else {

        response = { "success": true, "message": 'data fetched', 'data': agreement };
        res.json(response);
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  updateClientAgreement: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await ClientAgreement.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Client Agreement does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Client Agreement Id'));
      }
      next(error);
    }
  },

};