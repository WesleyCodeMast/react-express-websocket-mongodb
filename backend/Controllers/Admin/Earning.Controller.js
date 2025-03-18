const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const GlobalSetting = require('../../Models/GlobalSetting.model');
const Earning = require('../../Models/Earning.model');
const Payout = require('../../Models/Advisor/Payout.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  getAllEarnings: async (req, res, next) => {
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

      var totalPosts = await Earning.countDocuments({...filter_created_at, ...filter_status, ...filter_advisor, ...filter_client});

      Earning.find({...filter_created_at, ...filter_status, ...filter_advisor, ...filter_client}, {__v: 0, updatedAt: 0, advisor_id: 0, client_id: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('advisor', 'username name email mobile').populate('client', 'username name email mobile');
    } catch (error) {
      console.log(error.message);
    }
  },

  findEarningById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const payment = await Earning.findById(id, {__v: 0, updatedAt: 0, advisor_id: 0, client_id: 0}).populate('advisor', 'name email mobile').populate('client', 'name email mobile');;
      if (!payment) {
        throw createError(404, 'Earning does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: payment
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Earning id'));
        return;
      }
      next(error);
    }
  },

  createNewEarning: async (req, res, next) => {

    let rules = {
      chat_date: 'required'
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

      req.body.client = client.id;
      req.body.advisor = advisor.id;
      var amounn = ((req.body.chat_time / 60 )) * (req.body.advisor_rate);
      var appFee = req.body.commission_rate * 0.01 * amounn;
      req.body.amount = parseFloat(amounn).toFixed(2);
      req.body.app_fee = parseFloat(appFee).toFixed(2);
      req.body.commission_amount = parseFloat(req.body.commission_rate * 0.01 * amounn).toFixed(2);
      req.body.earning = parseFloat(amounn - appFee).toFixed(2);

      const payment = new Earning(req.body);
      const paymentResult = await payment.save();

      await AdvisorAuth.updateOne( { _id: advisorId },{ $inc: { chat_count: 1 }});

      advisor.earnings.push(paymentResult._id);

      await advisor.save();

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

  updateEarning: async (req, res, next) => {
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

      const paymentResult = await Earning.findByIdAndUpdate(id, updates, options);
      if (!paymentResult) {
        throw createError(404, 'Earning does not exist');
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
        return next(createError(400, 'Invalid Earning Id'));
      }

      next(error);
    }
  },

  deleteEarning: async (req, res, next) => {
    const id = req.params.id;
    try {

      const payment = await Earning.findById(id);

      const advisor = await AdvisorAuth.findById(payment.advisor._id);

      advisor.payments.pull(id);

      await advisor.save();

      const result = await Earning.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Earning does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Earning id'));
        return;
      }
      next(error);
    }
  },

  createPayout: async (req, res, next) => {
    const id = req.params.id;

    
    const advisor_id = req.body.advisor_id;

    const advisor = await AdvisorAuth.findById(advisor_id);

    if ((advisor.commission_rate) && (advisor.commission_rate > 0)) {
      var app_fee = parseFloat(advisor.commission_rate) * 0.01 * req.body.amount;
    }else{
      const setting = await GlobalSetting.findOne();

      if(setting) {
        var app_fee = parseFloat(setting.commission_rate) * 0.01 * req.body.amount;
      } else {
        var app_fee = parseFloat(1) * 0.01 * req.body.amount;
      }
    }

    try {

      const payoutt = await stripe.transfers.create({
        amount: Math.round((req.body.amount - app_fee)*100),
        currency: "usd",
        description: 'PAID to '+req.body.username,
        metadata: {
          'username': req.body.username,
          'amount': (req.body.amount-app_fee)*100 + ' cents'
        },
        destination: req.body.connect_id,
      });

      if(payoutt) {
        req.body.advisor = req.body.advisor_id;
        req.body.transaction_id = payoutt.id;
        req.body.amount = payoutt.amount/100;
        req.body.arrival_date = payoutt.arrival_date;
        req.body.description = payoutt.description;
        req.body.commission_fee = app_fee;
        req.body.advisor_stripe_id = payoutt.destination;
        req.body.status = payoutt.status;
          const payout = new Payout(req.body);
         
          const payoutResult = await payout.save();
          console.log("Payout Result",payoutResult);
          res.send({
            success: true,
            message: 'Data Added',
          });
      }

    } catch (error) {
      console.log("Payout Error:",error);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Earning id'));
        return;
      }
      next(error);
    }
  }

};