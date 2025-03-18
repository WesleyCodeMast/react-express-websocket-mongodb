const createError = require('http-errors');
const mongoose = require('mongoose');

const asyncHandler = require('../../Middleware/asyncHandler')

const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorReview = require('../../Models/Advisor/Review.model');

module.exports = {

  getAllAdvisors: asyncHandler(async (req, res, next) => {

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

    const suspended = true
        ? {
          suspended: 0
        }
        : {};

    var totalPosts =  await ClientAuth.findOne({_id: req.user.id},{advisors: 1})
    .populate({
      path: 'advisors',
      match:{
        ...filter_name, ...filter_id, ...suspended
      }
    });

    ClientAuth.findOne({_id: req.user.id},{advisors : 1})
    .populate({
      path: 'advisors',
      select: 'name username avatar email mobile createdAt',
      perDocumentLimit: size,
      options: {
        sort:{ $natural: -1 },
        skip: size * (page - 1),
      },
      match:{
        ...filter_name, ...filter_id, ...suspended
      }
    }).exec((err, result)=>{
      if (err) {
        response = { "error": true, "message": "Error fetching data" + err };
      } else {
        response = { "success": true, "message": 'data fetched', 'data': result.advisors, 'page': page, 'total': totalPosts.advisors.length, perPage: size };
      }
      res.json(response);
    });

  }),

  findAdvisorById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await AdvisorAuth.findById(id, { __v: 0, tokens: 0, updatedAt: 0 });
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

  deleteAdvisor: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await AdvisorAuth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Advisor does not exist.');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Advisor id'));
        return;
      }
      next(error);
    }
  },

  updateAdvisor: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Advisor Id'));
      }
      next(error);
    }
  },

  getAllReviews: asyncHandler(async (req, res, next) => {

    AdvisorAuth.findById(req.user._id,{ __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0},
      function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data };
        }
        res.json(response);
      }).populate('reviews');
  }),

};