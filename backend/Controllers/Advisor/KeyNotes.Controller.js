const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const KeyNotes = require('../../Models/Advisor/KeyNotes.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const ClientAuth = require('../../Models/Client/Auth.model');

module.exports = {
  getKeyNotes: async (req, res, next) => {
    try {
      
      const notes = await KeyNotes.find({advisor: req.user._id, client: req.params.id}, {__v: 0, updatedAt: 0}).sort({$natural: -1}).populate('advisor', 'name username email').populate('client', 'name username email');
      if (!notes) {
        const newKeyNotes = {
          notes: '',
        };

        const notes = new KeyNotes(newKeyNotes);
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

  createNewKeyNotes: async (req, res, next) => {

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
      req.body.advisor = req.user._id;
      req.body.client = req.body.client_id;
      await KeyNotes.find({advisor: req.user._id, client: req.body.client}).then(async result => {
        if (result.length > 0) {
          await KeyNotes.updateOne({advisor: req.user._id, client: req.body.client}, {$set:{notes: req.body.notes}})
          .then(result => {
            res.send({
              success: true,
              message: 'Data updated',
              data: result
            });
          })
        }
        else {
          const notes = new KeyNotes(req.body);
          const result = await notes.save();    
          res.send({
            success: true,
            message: 'Data inserted',
            data: result
          });
    
        }
      })
    } catch (error) {
      console.log(error.message);
      if (error.name === 'ValidationError') {
        next(createError(422, error.message));
        return;
      }
      next(error);
    }
  },

  deleteKeyNotes: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await KeyNotes.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Key Notes does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Key Notes id'));
        return;
      }
      next(error);
    }
  }

};