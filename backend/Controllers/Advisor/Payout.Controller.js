const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Payout = require('../../Models/Advisor/Payout.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {
  getAllPayouts: async (req, res, next) => {
    try {

      const filter_created_at = req.query.filter_created_at
      ? {
        addedAt: {
          $regex: req.query.filter_created_at
        }
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

      var totalPosts = await Payout.countDocuments({advisor: req.user._id, status: {$ne: 'generate'} , ...filter_created_at, ...filter_status, ...filter_advisor, ...filter_client});

      const totals = await Payout.aggregate([
          {
            $match:
              { advisor: req.user._id }
          },
          { "$group": { _id: { advisor: "$advisor" }, "totlAmt": { "$sum": "$amount" }, "totlCom": { "$sum": "$commission_fee" } } }
        ]);
      
      console.log("this is payout controller...")

      // let totalsAm = (totals.length > 0) ? totals[0].totlAmt : 0;
      // let commis = (totals.length > 0) ? totals[0].totlCom : 0;
      let totalsAm = 10000;
      let commis = 1000;
      let earning = totalsAm-commis;
        
      Payout.find({advisor: req.user._id, status: {$ne: 'generate'} , ...filter_created_at, ...filter_status, ...filter_advisor, ...filter_client }, {__v: 0, updatedAt: 0, advisor_id: 0, client_id: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, totalAmount: totalsAm, totalcommission: commis, totalEarning: earning, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('advisor', 'name email mobile');
    } catch (error) {
      console.log(error.message);
    }
  },

  findPaymentById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const payment = await Payment.findById(id, {__v: 0, updatedAt: 0, advisor_id: 0, client_id: 0}).populate('advisor', 'name email mobile').populate('client', 'name email mobile');;
      if (!payment) {
        throw createError(404, 'Payment does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: payment
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Payment id'));
        return;
      }
      next(error);
    }
  },

  createNewPayment: async (req, res, next) => {

    let rules = {
      payment: 'required'
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

      req.body.client_name = client.name;
      req.body.client_email = client.email;
      req.body.client_mobile = client.mobile;
      req.body.client_id = client._id;


      req.body.advisor_name = advisor.name;
      req.body.advisor_email = advisor.email;
      req.body.advisor_mobile = advisor.mobile;
      req.body.advisor_id = advisor._id;

      const payment = new Payment(req.body);
      const paymentResult = await payment.save();

      advisor.payments.push(paymentResult._id);

      await advisor.save();

      paymentResult.client = client._id;
      paymentResult.advisor = advisor._id;

      await paymentResult.save();

      res.send({
        success: true,
        message: 'Data inserted',
        data: paymentResult
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

  updatePayment: async (req, res, next) => {
    try {
      const id = req.params.id;

      const userId = req.body.client_id;
      const advisorId = req.body.advisor_id;

      const client = await ClientAuth.findById(userId);
      const advisor = await AdvisorAuth.findById(advisorId);

      advisor.payments.pull(id);

      await advisor.save();

      req.body.client_name = client.name;
      req.body.client_email = client.email;
      req.body.client_mobile = client.mobile;
      req.body.client_id = client._id;

      req.body.advisor_name = advisor.name;
      req.body.advisor_email = advisor.email;
      req.body.advisor_mobile = advisor.mobile;
      req.body.advisor_id = advisor._id;

      const updates = req.body;
      const options = { new: true };

      const paymentResult = await Payment.findByIdAndUpdate(id, updates, options);
      if (!paymentResult) {
        throw createError(404, 'Payment does not exist');
      }

      advisor.payments.push(paymentResult._id);

      await advisor.save();

      paymentResult.client = client._id;
      paymentResult.advisor = advisor._id;

      await paymentResult.save();

      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Payment Id'));
      }

      next(error);
    }
  },

  deletePayment: async (req, res, next) => {
    const id = req.params.id;
    try {

      const payment = await Payment.findById(id);

      const advisor = await AdvisorAuth.findById(payment.advisor._id);

      advisor.payments.pull(id);

      await advisor.save();

      const result = await Payment.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Payment does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Payment id'));
        return;
      }
      next(error);
    }
  }
};