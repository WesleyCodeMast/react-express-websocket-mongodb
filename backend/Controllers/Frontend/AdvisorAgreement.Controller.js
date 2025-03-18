const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const AdvisorAgreement = require('../../Models/AdvisorAgreement.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {
  getAdvisorAgreement: async (req, res, next) => {
    try {

      const agreement = await AdvisorAgreement.findOne({}, {__v: 0, updatedAt: 0});
      if (!agreement) {

        const newAdvisorAgreement = {
          agreement: '',
        };

        const agreement = new AdvisorAgreement(newAdvisorAgreement);
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

};