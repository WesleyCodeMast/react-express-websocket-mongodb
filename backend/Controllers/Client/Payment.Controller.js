const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Payment = require('../../Models/Payment.model');
const Earning = require('../../Models/Earning.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {
  getAllPayments: async (req, res, next) => {
    try {
/*var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      var skip = size * (page - 1);
      var limit = size;
        const results = await Payment.aggregate([
    {
      "$group": {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d", date: "$createdAt"
          }
        } ,
        count:{
          $sum:"$amount"
        },
        messages: {
          $push: {
            client: "$client",
            advisor: "$advisor",
            createdAt: "$createdAt"
          }
        }
      }
    },
    { $sort: { _id: -1 } },
    { $skip: skip  },
    { $limit: limit  }
    ]);

        console.log('results',results);
        return 1;*/

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

      var totalPosts = await Payment.countDocuments({client: req.user._id, ...filter_created_at, ...filter_status, ...filter_advisor, ...filter_client});


      const totals = await Payment.aggregate([
          {
            $match:
              { client: req.user._id }
          },
          { "$group": { _id: { client: "$client" }, "totlAmt": { "$sum": "$amount" }, "totlCom": { "$sum": "$app_fee" } } }
        ]);

      let totalsAm = totals.length > 0 ? parseFloat(totals[0].totlAmt).toFixed(2) : 0;
      let commis = totals.length > 0 ? parseFloat(totals[0].totlCom).toFixed(2) : 0;
      let earning = parseFloat(totalsAm-commis).toFixed(2);;

      Payment.find({client: req.user._id, ...filter_created_at, ...filter_status, ...filter_advisor, ...filter_client}, {__v: 0, updatedAt: 0, advisor_id: 0, client_id: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, totalAmount: totalsAm, totalcommission: commis, totalEarning: earning, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('advisor', 'name email mobile').populate('client', 'name email mobile');
    } catch (error) {
      console.log(error.message);
    }
  },

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

      var totalPosts = await Earning.countDocuments({client: req.user._id, ...filter_created_at, ...filter_status, ...filter_advisor, ...filter_client});


      const totals = await Earning.aggregate([
          {
            $match:
              { client: req.user._id }
          },
          { "$group": { _id: { client: "$client" }, "totlAmt": { "$sum": "$amount" }, "totlCom": { "$sum": "$app_fee" } } }
        ]);

      // let totalsAm = parseFloat(totals[0].totlAmt).toFixed(2);;
      let totalsAm = 10000;
      console.log("this is client payment controller...")
      // let commis = parseFloat(totals[0].totlCom).toFixed(2);;
      let commis = 1000;
      let earning = parseFloat(totalsAm-commis).toFixed(2);;

      Earning.find({client: req.user._id, ...filter_created_at, ...filter_status, ...filter_advisor, ...filter_client}, {__v: 0, updatedAt: 0, advisor_id: 0, client_id: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {

            let payment_data = [];

            for (let paymentData of data) {

              payment_data.push({
                "_id": paymentData._id, 
                "client": paymentData.client,
                "advisor": paymentData.advisor,
                "chat_date": paymentData.chat_date, 
                "chat_time": paymentData.chat_time,
                "chat_start_time": paymentData.chat_start_time, 
                "chat_end_time": paymentData.chat_end_time, 
                "advisor_rate": paymentData.advisor_rate,
                "commission_rate": paymentData.commission_rate,
                "amount":  paymentData.amount,
                "commission_amount": paymentData.commission_amount,
                "earning":  parseFloat(paymentData.earning).toFixed(2),
                "free_minutes": paymentData.free_minutes,
                "app_fee": paymentData.app_fee,
                "status": paymentData.status,
                "createdAt": paymentData.createdAt, 
              })
            }

            response = { "success": true, "message": 'data fetched', 'data': payment_data, 'page': page, 'total': totalPosts, totalAmount: totalsAm, totalcommission: commis, totalEarning: earning, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('advisor', 'name email mobile').populate('client', 'name email mobile');
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