const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const AdvisorNotes = require('../../Models/Advisor/AdvisorNotes.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const ClientAuth = require('../../Models/Client/Auth.model');

module.exports = {
  getAdvisorNotes: async (req, res, next) => {
    try {

      const notes = await AdvisorNotes.find({}, {__v: 0, updatedAt: 0});
      if (!notes) {

        const newAdvisorNotes = {
          notes: '',
        };

        const notes = new AdvisorNotes(newAdvisorNotes);
        const notesResult = await notes.save();

        response = { "success": true, "message": 'data fetched', 'data': notesResult };
        res.json(response);
      } else {

        response = { "success": true, "message": 'data fetched', 'data': notes };
        res.json(response);
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  createNewAdvisorNotes: async (req, res, next) => {

    let rules = {
      notes: 'required'
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
      req.body.advisor = req.body.advisor_id;
      req.body.client = req.body.client_id;
      const notes = new AdvisorNotes(req.body);
      const result = await notes.save();

      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

      advisor.notes.push(result._id);
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

};