const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const UploadBanner = require('../../Models/Admin/UploadBanner.model');
const ContactUsBanner = require('../../Models/Admin/ContactUsBanner.model');

module.exports = {
  getAllUploadBanners: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await UploadBanner.countDocuments();

      UploadBanner.find({}, {__v: 0, updatedAt: 0},
        query, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage: size };
          }
          res.json(response);
        }).sort({ $natural: -1 });
    } catch (error) {
      console.log(error.message);
    }
  },

  getUploadBanners: async (req, res, next) => {
    try {

      UploadBanner.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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

  findUploadBannerById: async (req, res, next) => {
    try {
      const review = await ContactUsBanner.findOne();
      if (!review) {

        const imag = new ContactUsBanner({contact_title: req.body.contact_title, support_email: req.body.support_email});

        await imag.save();

        const review = await ContactUsBanner.findOne();

      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid UploadBanner id'));
        return;
      }
      next(error);
    }
  },

  createNewUploadBanner: async (req, res, next) => {

    try {

      const files = req.files;

      files.forEach( async (element,index) => {
        const imag = new UploadBanner({image:element.path});
        await imag.save();
      });
      
      res.send({
        success: true,
        message: 'Image uploaded success!',
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

  createNewUploadBannerContactUs: async (req, res, next) => {

    try {

      const imag = await ContactUsBanner.findOne();

      imag.contact_title = req.body.contact_title;
      imag.support_email = req.body.support_email;

      if (req.file) {
        imag.image = req.file.path;
      }

      await imag.save();
      
      res.send({
        success: true,
        message: 'Image uploaded success!',
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

  updateUploadBanner: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await UploadBanner.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'UploadBanner does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid UploadBanner Id'));
      }

      next(error);
    }
  },

  deleteUploadBanner: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await UploadBanner.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'UploadBanner does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid UploadBanner id'));
        return;
      }
      next(error);
    }
  }
};