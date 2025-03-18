const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const AdvisorCertificate = require('../../Models/Advisor/AdvisorCertificate.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const ClientAuth = require('../../Models/Client/Auth.model');

module.exports = {
  getAdvisorCertificate: async (req, res, next) => {
    try {

      const certificate = await AdvisorCertificate.find({}, {__v: 0, updatedAt: 0});
      if (!certificate) {

        const newAdvisorCertificate = {
          certificate: '',
        };

        const certificate = new AdvisorCertificate(newAdvisorCertificate);
        const certificateResult = await certificate.save();

        response = { "success": true, "message": 'data fetched', 'data': certificateResult };
        res.json(response);
      } else {

        response = { "success": true, "message": 'data fetched', 'data': certificate };
        res.json(response);
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  deleteAdvisorCertificate: async (req, res, next) => {
    try {

      const advisor = await AdvisorAuth.findById(req.params.advisor);
      const certificate = await AdvisorCertificate.findOne({_id: req.params.id});

      advisor.certificate.pull(certificate._id);
      await advisor.save();


      response = { "success": true, "message": 'data deleted successfully!'};
      res.json(response);

    } catch (error) {
      console.log(error);
    }
  },

  createNewAdvisorCertificate: async (req, res, next) => {
    try {

      req.body.advisor = req.body.advisor_id;
      req.body.certificate = req.file.path;
      const certificate = new AdvisorCertificate(req.body);
      const result = await certificate.save();

      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

      advisor.certificate.push(result._id);
      await advisor.save();

      res.send({
        success: true,
        message: 'Data inserted',
        data: advisor
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

};