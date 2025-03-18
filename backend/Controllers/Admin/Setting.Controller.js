const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');
var fs = require('fs');
const GlobalSetting = require('../../Models/GlobalSetting.model');

module.exports = {
  getAllSettings: async (req, res, next) => {
    try {

      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Setting.countDocuments();

      Setting.find({}, {__v: 0, updatedAt: 0},
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

  getSettings: async (req, res, next) => {
    try {

      Setting.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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

  getGlobalSettings: async (req, res, next) => {
    const id = req.params.id;
    try {
      const settingCount = await GlobalSetting.countDocuments();
      if (settingCount <= 0) {

        const setting = {
          min_rate_per_minute: 0,
          max_rate_per_minute: 0,
          promotional_minutes: 30,
          min_chat_minutes: 0,
          commission_rate: 0,
          tracking_keywords: '',
        };

        const settingData = new GlobalSetting(setting);
        const result = await settingData.save();

        res.send({
          success: true,
          message: 'Data fetched',
          data: result
        });

      }else{

        const setting = await GlobalSetting.findOne();

        res.send({
          success: true,
          message: 'Data fetched',
          data: setting
        });
      }
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Global Setting id'));
        return;
      }
      next(error);
    }
  },

   updateGlobalSettings: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;

      const result = await GlobalSetting.updateMany(updates);
      if (!result) {
        throw createError(404, 'Global Setting does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Global Setting Id'));
      }

      next(error);
    }
  },

  findSettingById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const setting = await Setting.findById(id,{__v: 0, updatedAt: 0});
      if (!setting) {
        throw createError(404, 'Setting does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: setting
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Setting id'));
        return;
      }
      next(error);
    }
  },

  createNewSetting: async (req, res, next) => {

    let rules = {
      issue: 'required',
      solution: 'required',
      email: 'required',
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
      const ticket = new Setting(req.body);
      const result = await ticket.save();
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

  updateSetting: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await Setting.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Setting does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Setting Id'));
      }

      next(error);
    }
  },

  uploadLogoSetting: async (req, res, next) => {
    try {

      const data = await GlobalSetting.findOne({});

      var filePath = data.logo; 

      if(!req.file){
        return res.send({
          success: false,
          message: 'please upload logo!',
        });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const options = { new: true };
      const result = await GlobalSetting.updateOne({}, {logo:req.file.path}, options);
      if (!result) {
        throw createError(404, 'Setting does not exist');
      }

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

  getGlobalSetting: async (req, res, next) => {
    try {

      const data = await GlobalSetting.findOne({});
      
      res.send({
        success: true,
        data: data.logo,
        message: 'Data fetched success!',
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


  deleteSetting: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Setting.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Setting does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Setting id'));
        return;
      }
      next(error);
    }
  }
};