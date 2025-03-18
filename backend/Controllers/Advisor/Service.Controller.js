const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Service = require('../../Models/Advisor/Service.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');

module.exports = {
  getAllServices: async (req, res, next) => {
    try {

      const services = await Service.findOne({}, {__v: 0, updatedAt: 0});
      if (!services) {

        const advisorId = req.user.id;

        const advisor = await AdvisorAuth.findById(advisorId);

        const newService = {
          name1: '',
          description1: '',
          name2: '',
          description2: '',
          name3: '',
          description3: '',
          advisor: advisor._id
        };

        const service = new Service(newService);
        const serviceResult = await service.save();

        advisor.service = serviceResult._id;
        await advisor.save();
        response = { "success": true, "message": 'data fetched', 'data': serviceResult };
        res.json(response);
      } else {

        response = { "success": true, "message": 'data fetched', 'data': services };
        res.json(response);
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  getServices: async (req, res, next) => {
    try {

      Service.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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

  findServiceById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await Service.findById(id,{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'Service does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Service id'));
        return;
      }
      next(error);
    }
  },

  createNewService: async (req, res, next) => {

    // let rules = {
    //   name1: 'required'
    // };

    // await validator(req.body, rules, {}, (err, status) => {
    //   if (!status) {
    //     res.status(412)
    //     .send({
    //       success: false,
    //       message: 'Validation failed',
    //       data: err
    //     });
    //   }
    // }).catch( err => console.log(err))

    try {

      const advisorId = req.user._id;

      const advisor = await AdvisorAuth.findById(advisorId);

      const service = new Service(req.body);
      const serviceResult = await service.save();

      advisor.service = serviceResult._id;
      await advisor.save();

      res.send({
        success: true,
        message: 'Data inserted',
        data: serviceResult
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

  updateService: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const advisorId = req.user._id;

      const advisor = await AdvisorAuth.findById(advisorId);

      advisor.service = id;
      await advisor.save();

      const result = await Service.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Service does not exist');
      }

      advisor.service_name1 = req.body.name1;
      advisor.service_name2 = req.body.name2;
      advisor.service_name3 = req.body.name3;

      advisor.service_description1 = req.body.description1;
      advisor.service_description2 = req.body.description2;
      advisor.service_description3 = req.body.description3;

      advisor.save();

      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Service Id'));
      }
      next(error);
    }
  },

  deleteService: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Service.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Service does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Service id'));
        return;
      }
      next(error);
    }
  }
};