const createError = require('http-errors');
const mongoose = require('mongoose');
const Validator = require('validatorjs');
const validator = require('../../helpers/validate');
const asyncHandler = require('../../Middleware/asyncHandler')

const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {

  getAllFavouriteAdvisors: asyncHandler(async (req, res, next) => {

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

    var totalPosts =  await ClientAuth.findOne({_id: req.user.id},{favourite_advisors: 1})
    .populate({
      path: 'favourite_advisors',
    });

    ClientAuth.findOne({_id: req.user.id},{favourite_advisors : 1})
    .populate({
      path: 'favourite_advisors',
      select: 'name username email mobile createdAt',
      perDocumentLimit: size,
      options: {
        sort:{ $natural: -1 },
        skip: size * (page - 1),
      },
      match:{
        ...filter_name
        }
    }).exec((err, result)=>{
      if (err) {
        response = { "error": true, "message": "Error fetching data" + err };
      } else {
        response = { "success": true, "message": 'data fetched', 'data': result.favourite_advisors, 'page': page, 'total': totalPosts.favourite_advisors.length, perPage: size };
      }
      res.json(response);
    });

  }),

  findFavouriteAdvisorById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await AdvisorAuth.findById(id, { __v: 0, tokens: 0, updatedAt: 0, clients: 0, reviews: 0, tickets: 0, confirmationCode: 0, notes: 0, earnings: 0 });
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
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

  deleteFavouriteAdvisor: async (req, res, next) => {
    const id = req.params.id;
    try {
      const client = await ClientAuth.findById(req.user._id);
      
      if (!client) {
        throw createError(201, 'Favourite Advisor does not exist.');
      }
      client.favourite_advisors.pull(id);
      await client.save();

      res.send({
        success: true,
          message: 'Data deleted successfully!',
          data: client.favourite_advisors
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid FavouriteAdvisor id'));
        return;
      }
      next(error);
    }
  },


  createNewFavouriteAdvisor: async (req, res, next) => {

    let rules = {
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
      client.favourite_advisors.pull(req.body.advisor_id);
      await client.save();
      client.favourite_advisors.push(req.body.advisor_id);
      await client.save();

      res.send({
        success: true,
        message: 'Data inserted',
        data: client.favourite_advisors
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

  updateFavouriteAdvisor: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await FavouriteAdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'FavouriteAdvisor does not exist');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid FavouriteAdvisor Id'));
      }
      next(error);
    }
  },

};