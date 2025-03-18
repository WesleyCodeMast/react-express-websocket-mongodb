const createError = require('http-errors');
const mongoose = require('mongoose');
const validator = require('../../helpers/validate');

const Page = require('../../Models/Page.model');

const titleToSlug = title => {
    let slug;

    // convert to lower case
    slug = title.toLowerCase();

    // remove special characters
    slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi, '');
    // The /gi modifier is used to do a case insensitive search of all occurrences of a regular expression in a string

    // replace spaces with dash symbols
    slug = slug.replace(/ /gi, "-");
    
    // remove consecutive dash symbols 
    slug = slug.replace(/\-\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-/gi, '-');
    slug = slug.replace(/\-\-/gi, '-');

    // remove the unwanted dash symbols at the beginning and the end of the slug
    slug = '@' + slug + '@';
    slug = slug.replace(/\@\-|\-\@|\@/gi, '');
    return slug;
};


module.exports = {
  getAllPages: async (req, res, next) => {
    try {
      console.log("here is get all pages...");
      var page = parseInt(req.query.page) || 1;
      var size = parseInt(req.query.size) || 15;
      var query = {}

      query.skip = size * (page - 1);
      query.limit = size;

      var totalPosts = await Page.countDocuments({slug : { $ne: 'home-page-text'}});

      Page.find({slug : { $ne: 'home-page-text'}}, {__v: 0, updatedAt: 0},
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

  getPages: async (req, res, next) => {
    try {

      Page.find({}, {__v:0, updatedAt: 0}, function (err, data) {
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


  getPagesByType: async (req, res, next) => {
    try {

      const type = req.params.type;

      Page.find({type: type}, {__v:0, updatedAt: 0}, function (err, data) {
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

  findPageById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const review = await Page.findById(id,{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'Page does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Page id'));
        return;
      }
      next(error);
    }
  },

  findPageBySlug: async (req, res, next) => {
    const id = req.params.slug;
    try {
      const review = await Page.findOne({slug:id},{__v: 0, updatedAt: 0});
      if (!review) {
        throw createError(404, 'Page does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: review
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Page id'));
        return;
      }
      next(error);
    }
  },

  uploadPageImage: async (req, res, next) => {
    try {
      
      res.send({
        success: true,
        message: 'user updated!',
        data: req.file.path
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  createNewPage: async (req, res, next) => {

    let rules = {
      title: 'required',
      content: 'required'
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
      req.body.slug = await titleToSlug(req.body.title);
      const keyword = new Page(req.body);
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

  updatePage: async (req, res, next) => {
    try {
      const id = req.params.id;
      req.body.slug = await titleToSlug(req.body.title);
      const updates = req.body;
      const options = { new: true };

      const result = await Page.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Page does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Page Id'));
      }

      next(error);
    }
  },

  updateHomePageText: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const result = await Page.findOneAndUpdate({'slug': 'home-page-text'}, updates, options);
      if (!result) {
        throw createError(404, 'Page does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Page Id'));
      }

      next(error);
    }
  },

  getHomePageText: async (req, res, next) => {
    try {
      console.log("request is OK!!!!!!!!!!!!!!")
      const result = await Page.findOne({'slug': 'home-page-text'});
      if (!result) {

      const keyword = new Page({
        'title' : 'Home Page Text',
        'slug' : 'home-page-text',
        'content': ''
      });

      const result = await keyword.save();

        throw createError(404, 'Page does not exist');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Page Id'));
      }

      next(error);
    }
  },

  deletePage: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Page.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, 'Page does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });Page
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Page id'));
        return;
      }
      next(error);
    }
  }
};