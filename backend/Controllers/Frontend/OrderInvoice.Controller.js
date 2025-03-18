const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const OrderInvoice = require('../../Models/OrderInvoice.model');

module.exports = {
  getAllOrderInvoices: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await OrderInvoice.countDocuments();

      OrderInvoice.find({}, {__v: 0, updatedAt: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('client', 'username email mobile').populate('advisor','username email mobile');;
    } catch (error) {
      console.log(error.message);
    }
  },

  getOrderInvoices: async (req, res, next) => {
    try {

      OrderInvoice.find({}, {__v:0, updatedAt: 0}, function (err, data) {

          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data};
          }

          res.json(response);
        }).sort({ $natural: -1 });
    } catch (error) {
      console.log(error.message);
    }
  },

  findOrderInvoiceById: async (req, res, next) => {
    const client = req.params.client_id;
    const advisor = req.params.advisor_id;
    try {
      const review = await OrderInvoice.findOne({client: client, advisor: advisor},{__v: 0, updatedAt: 0}).populate('client', 'username email mobile').populate('advisor','username email mobile');
      if (!review) {
        throw createError(404, 'OrderInvoice does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid OrderInvoice id'));
        return;
      }
      next(error);
    }
  },

  createNewOrderInvoice: async (req, res, next) => {

    let rules = {
      advisor_id: 'required',
      client_id: 'required',
      start_time: 'required',
      end_time: 'required',
      advisor_rate: 'required'
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

      req.body.client = req.body.client_id;
      req.body.advisor = req.body.advisor_id; 
      const keyword = new OrderInvoice(req.body);
      const result = await keyword.save();
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

  updateOrderInvoice: async (req, res, next) => {
    try {
      const client = req.params.client_id;
      const advisor = req.params.advisor_id;
      const updates = req.body;
      const options = { new: true };
      
      const result = await OrderInvoice.findOneAndUpdate({client: client, advisor: advisor}, updates, options);
      if (!result) {
        throw createError(404, 'OrderInvoice does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid OrderInvoice Id'));
      }

      next(error);
    }
  },

  deleteOrderInvoice: async (req, res, next) => {
    const client = req.params.client_id;
    const advisor = req.params.advisor_id;
    try {
      const result = await OrderInvoice.deleteMany({client: client, advisor: advisor});
      if (!result) {
        throw createError(404, 'OrderInvoice does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid OrderInvoice id'));
        return;
      }
      next(error);
    }
  }
};