const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');
var ejs = require("ejs");
const path = require('path')
const Review = require('../../Models/Advisor/Review.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const Message = require('../../Models/Message.model');
const Nodemailer = require('../../Utils/Nodemailer');
const GlobalSetting = require('../../Models/GlobalSetting.model');


module.exports = {

  createNewReview: async (req, res, next) => {


    let rules = {
      review: 'required',
      rating: 'required',
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

      const userId = req.user._id;
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
      req.body.type = 'review';
      req.body.addedAt = today;

      if (req.body.rating == 5) {
        req.body.status = 1;
        req.body.approved = 1;
      } else {
        req.body.sender = client._id;
        req.body.reciver = req.body.advisor_id;
        req.body.client = client._id;
        req.body.advisor = req.body.advisor_id;
        req.body.sender_reseptent = client._id+'_'+req.body.advisor_id;
        req.body.message_from = 'client';
        req.body.message_to = 'advisor';
        req.body.message = 'Client : ' + client.username+" You have received an unhappy review. <span style='font-size:12px;'>&#128542;</span> Please check the review and speak with your client. </br> "+req.body.review;
        req.body.users = [client._id, req.body.advisor_id];
        const message = new Message(req.body);
        const result = await message.save();

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

      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;

      var absoluteBasePath = path.resolve('');

      const htmlAdvisor = await ejs.renderFile(absoluteBasePath+"/views/review.ejs", {logo:logo,name: advisor.username, client: client.username, client_email: client.email, review: reviewResult.review, rating: reviewResult.rating});

      Nodemailer.sendReviewNotification(
        advisor.username,
        advisor.email,
        client.username,
        client.email,
        htmlAdvisor
      );

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
  }
  
};