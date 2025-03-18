const createError = require('http-errors');
const mongoose = require('mongoose');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => 
 fetch(...args));

const Enquiry = require('../../Models/Enquiry.model');

module.exports = {
  getAllEnquirys: async (req, res, next) => {
    try {

      const filter_date = req.query.filter_date
        ? {
          booking_date: {
            $regex: req.query.filter_date
          },
        }
        : {};

      const filter_created_at = req.query.filter_created_at
        ? {
          addedAt: {
            $regex: req.query.filter_created_at
          }
        }
        : {};

      const filter_name = req.query.filter_name
        ? {
          traveller_name: {
            $regex: req.query.filter_name,
            $options: "i",
          },
        }
        : {};

      const filter_type = req.query.filter_type
        ? {
          type: req.query.filter_type
        }
        : {};

      const filter_phone = req.query.filter_phone
        ? {
          phone: {
            $regex: req.query.filter_phone,
            $options: "i",
          }
        }
        : {};

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var type = req.query.type || 'general';
      var query = {}
      if (page < 0 || page === 0) {
        response = { "error": true, "message": "invalid page number, should start with 1" };
        return res.json(response);
      }
      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Enquiry.find({ ...filter_date, ...filter_name, ...filter_phone, ...filter_created_at, ...filter_type }).countDocuments().exec();

      const data = await Enquiry.find({ ...filter_date, ...filter_name, ...filter_phone, ...filter_created_at, ...filter_type }, {},
        query).sort({ $natural: -1 });

      if (!data) {
        response = { "error": true, "message": "Error fetching data" + err };
      } else {

        /*let enqueryList = [];

        for (let resData of data) {

          const apiResponse = await fetch(`${process.env.HOTEL_MiCROSERVICE_URL}/hotels/${resData.hotel_id}`);

          const apiResponseJson = await apiResponse.json();

          if (apiResponseJson.success) {
            var hotel = apiResponseJson.data.name;
          }else{
            var hotel = '';
          }

          enqueryList.push({
            _id:resData._id,
            type: resData.type,
            booking_date: resData.booking_date,
            traveller_name: resData.traveller_name,
            phone: resData.phone,
            message: resData.message,
            hotel_id: resData.hotel_id,
            hotel: hotel,
          });   

        }*/

        response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
      }

      return res.json(response);

    } catch (error) {
      console.log(error.message);
    }
  },

  getAllEnquiriesCustomer: async (req, res, next) => {
    try {

      var type = req.query.type || 'general';

      const enq_cust = await Enquiry.distinct('traveller_name', { type: type });
      if (!enq_cust) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': enq_cust };
          }
          return res.json(response);
    } catch (error) {
      console.log(error.message);
    }
  },

  getAllEnquiesDashboard: async (req, res, next) => {
    try {

      var totalEnq = await Enquiry.find({}).countDocuments().exec();

      const general_enqs = await Enquiry.find({type: {$ne: "hotel"}}).sort({ $natural: -1 }).limit(5);

      const hotel_enqs = await Enquiry.find({type: 'hotel' }).sort({ $natural: -1 }).limit(5);

      res.send({
        success: true,
        message: 'Data fetched',
        total_enquiries: totalEnq,
        hotel_enquiries: hotel_enqs,
        general_enquiries: general_enqs,
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  createNewEnquiry: async (req, res, next) => {
    try {

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      req.body.addedAt = today;

      const date = new Enquiry(req.body);

      const result = await date.save();
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

  SveEnquiry: async (req, res, next) => {
    try {

      const params = new URLSearchParams();

      const meta = {type:req.body.type};

      params.append('name', req.body.name);
      params.append('mobile', req.body.mobile);
      params.append('email', req.body.email);
      params.append('website', 'ranthamboretigerreserve.in');
      params.append('meta', meta);

      const data = {};

      // const response = await fetch('https://crm.junglesafariindia.in/api/save-lead', {method: 'POST', body: params});
      // const data = await response.json();

      res.send({
        success: true,
        message: 'Data inserted',
        data: data
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

  findEnquiryById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const date = await Enquiry.findById(id);
      if (!date) {
        throw createError(404, 'Enquiry does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: date
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Enquiry id'));
        return;
      }
      next(error);
    }
  },

  deleteAEnquiry: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Enquiry.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Enquiry does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Enquiry id'));
        return;
      }
      next(error);
    }
  },
};