const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Review = require('../../Models/Advisor/Review.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {
  getAllReviews: async (req, res, next) => {
    try {

      const filter_created_from = req.query.filter_created_from
      ? {
          createdAt : {$gte: req.query.filter_created_from, $lte: req.query.filter_created_to}
      }
      : {};


    const filter_client = req.query.filter_client
        ? {
          client_name: {
            $regex: req.query.filter_client,
            $options: "i",
          },
        }
        : {};

      const filter_advisor = req.query.filter_advisor
        ? {
          advisor_name: {
            $regex: req.query.filter_advisor,
            $options: "i",
          },
        }
        : {};

    const filter_status = req.query.filter_status
      ? {
        status: req.query.filter_status
      }
      : {};

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Review.countDocuments({...filter_created_from, ...filter_status, ...filter_advisor, ...filter_client});

      Review.find({...filter_created_from, ...filter_status, ...filter_advisor, ...filter_client}, {__v: 0, updatedAt: 0, advisor_id: 0, client_id: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('advisor', 'name username email mobile').populate('client', 'name username email mobile');
    } catch (error) {
      console.log(error.message);
    }
  },

  findReviewById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await Review.findById(id, {__v: 0, updatedAt: 0, advisor_id: 0, client_id: 0}).populate('advisor', 'name username email mobile').populate('client', 'name username email mobile');;
      if (!review) {
        throw createError(404, 'Review does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Review id'));
        return;
      }
      next(error);
    }
  },

  createNewReview: async (req, res, next) => {

    let rules = {
      review: 'required'
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


      const userId = req.body.client_id;
      const advisorId = req.body.advisor_id;

      const client = await ClientAuth.findById(userId);
      const advisor = await AdvisorAuth.findById(advisorId);

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      req.body.client_name = client.name;
      req.body.client_email = client.email;
      req.body.client_mobile = client.mobile;
      req.body.client_id = client._id;
      req.body.addedAt = today;

      if (req.body.rating == 5) {
        req.body.status = 1;
        req.body.approved = 1;
      }

      if (req.body.rating == 1) {
        req.body.status = 0;
        req.body.approved = 0;
      }

      req.body.advisor_name = advisor.name;
      req.body.advisor_email = advisor.email;
      req.body.advisor_mobile = advisor.mobile;
      req.body.advisor_id = advisor._id;

      const review = new Review(req.body);
      const reviewResult = await review.save();

      advisor.reviews.push(reviewResult._id);

      await advisor.save();

      reviewResult.client = client._id;
      reviewResult.advisor = advisor._id;

      await reviewResult.save();

      const id = advisor._id;

      var d = new Date();
      var d1 = new Date();
      d.setDate(d.getDate() - 15);

      var startDate = d.toISOString();
      var endDate = d1.toISOString();

      const unHappyReviewsCount = await Review.countDocuments({ advisor:id, status: 0, approved: 0, createdAt : {$gte: startDate, $lte: endDate } });

      let reviewCount = 5;
      let rem = unHappyReviewsCount -2;
      let no = Math.round((rem*0.1) * 10) / 10
      reviewCount = reviewCount - (no);

      const happyReviewsCount = await Review.countDocuments({ advisor:id, status: 1, approved: 1, createdAt : {$gte: startDate, $lte: endDate } });


      if (happyReviewsCount > 3) {

        let remH = happyReviewsCount -3;

        let no1 = Math.round((remH*0.1) * 10) / 10;

        reviewCount = reviewCount + no1;
      }

      reviewCount = Math.round(reviewCount*10) /10;

      if (reviewCount > 5 ) {
        reviewCount = 5;
      }

      advisor.review_avg = reviewCount;
      advisor.unhappy_review = unHappyReviewsCount;
      advisor.happy_review = happyReviewsCount;

      await advisor.save();

      res.send({
        success: true,
        message: 'Data inserted',
        data: reviewResult
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

  updateReview: async (req, res, next) => {
    try {
      const id = req.params.id;

      const userId = req.body.client_id;
      const advisorId = req.body.advisor_id;

      const client = await ClientAuth.findById(userId);
      const advisor = await AdvisorAuth.findById(advisorId);

      advisor.reviews.pull(id);

      await advisor.save();

      req.body.client_name = client.name;
      req.body.client_email = client.email;
      req.body.client_mobile = client.mobile;
      req.body.client_id = client._id;

      req.body.advisor_name = advisor.name;
      req.body.advisor_email = advisor.email;
      req.body.advisor_mobile = advisor.mobile;
      req.body.advisor_id = advisor._id;

      if (req.body.status == 1) {
        req.body.status = 1;
        req.body.approved = 1;
      }

      if (req.body.status == 0) {
        req.body.status = 0;
        req.body.approved = 0;
      }

      const updates = req.body;
      const options = { new: true };

      const reviewResult = await Review.findByIdAndUpdate(id, updates, options);
      if (!reviewResult) {
        throw createError(404, 'Review does not exist');
      }

      advisor.reviews.push(reviewResult._id);

      await advisor.save();

      reviewResult.client = client._id;
      reviewResult.advisor = advisor._id;


      var d = new Date();
      var d1 = new Date();
      d.setDate(d.getDate() - 15);

      var startDate = d.toISOString();
      var endDate = d1.toISOString();

      const unHappyReviewsCount = await Review.countDocuments({ advisor:advisor.id, status: 0, approved: 0, createdAt : {$gte: startDate, $lte: endDate } });

      let reviewCount = 5;
      let rem = unHappyReviewsCount -2;
      let no = Math.round((rem*0.1) * 10) / 10
      reviewCount = reviewCount - (no);

      const happyReviewsCount = await Review.countDocuments({ advisor:advisor.id, status: 1, approved: 1, createdAt : {$gte: startDate, $lte: endDate } });

      let no1 = Math.round((happyReviewsCount*0.1) * 10) / 10

      reviewCount = reviewCount + no1;

      reviewCount = Math.round(reviewCount*10) /10;

      if (reviewCount > 5 ) {
        reviewCount = 5;
      }

      advisor.review_avg = reviewCount;
      advisor.unhappy_review = unHappyReviewsCount;
      advisor.happy_review = happyReviewsCount;

      await advisor.save();

      await reviewResult.save();

      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Review Id'));
      }

      next(error);
    }
  },

  deleteReview: async (req, res, next) => {
    const id = req.params.id;
    try {

      const review = await Review.findById(id);

      const advisor = await AdvisorAuth.findById(review.advisor._id);

      advisor.reviews.pull(id);

      await advisor.save();

      const result = await Review.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Review does not exist.');
      }

      var d = new Date();
      var d1 = new Date();
      d.setDate(d.getDate() - 15);

      var startDate = d.toISOString();
      var endDate = d1.toISOString();

      const unHappyReviewsCount = await Review.countDocuments({ advisor:advisor.id, status: 0, approved: 0, createdAt : {$gte: startDate, $lte: endDate } });

      let reviewCount = 5;
      let rem = unHappyReviewsCount -2;
      let no = Math.round((rem*0.1) * 10) / 10
      reviewCount = reviewCount - (no);

      const happyReviewsCount = await Review.countDocuments({ advisor:advisor.id, status: 1, approved: 1, createdAt : {$gte: startDate, $lte: endDate } });

      let no1 = Math.round((happyReviewsCount*0.1) * 10) / 10

      reviewCount = reviewCount + no1;

      reviewCount = Math.round(reviewCount*10) /10;

      if (reviewCount > 5 ) {
        reviewCount = 5;
      }

      advisor.review_avg = reviewCount;
      advisor.unhappy_review = unHappyReviewsCount;
      advisor.happy_review = happyReviewsCount;

      await advisor.save();

      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Review id'));
        return;
      }
      next(error);
    }
  }
};