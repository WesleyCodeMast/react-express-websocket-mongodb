const createError = require('http-errors');
const mongoose = require('mongoose');

const SignupInfos = require('../../Models/Admin/Signupinfo.model');

module.exports = {
  getSignupinfo: async (req, res, next) => {
    try {

      const topics = await SignupInfos.findOne({}, {__v: 0, updatedAt: 0});

      if (!topics) {
        const newSignupInfos= {
          headline: '',
          title: [],
          featureheadline1: '',
          featuredesc1: '',
          featureimage1:'',
          featureheadline2: '',
          featuredesc2: '',
          featureimage2:'',
          featureheadline3: '',
          featuredesc3: '',
          featureimage3:'',
        };

        const SignupInfos2 = new SignupInfos(newSignupInfos);
        const signupinfoResult = await SignupInfos2.save();

        response = { "success": true, "message": 'data fetched', 'data': signupinfoResult };
        res.json(response);
      } else {

        const title = [];
           
        if(topics.title) {
           topics.title.map((itm) => (
              title.push({ listname: itm })
           ));
        }

        response = { "success": true, "message": 'data fetched', 'data': topics , 'title': title };
        res.json(response);
      }
    } catch (error) {
      console.log(error);
    }
  },

  updateSingupinfo: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };
  
      if(req.body.title) {
        req.body.title = req.body.title.split(",");
      }
    
      if (req.files) {

        const files = req.files;

        files.forEach( async (element,index) => {

          if (element.fieldname == 'featureimage1') {   
            req.body.featureimage1 = element.path;
          }

          if (element.fieldname == 'featureimage2') {
            req.body.featureimage2 = element.path;
          }

          if (element.fieldname == 'featureimage3') {
            req.body.featureimage3 = element.path;
          }

        });
      }

      const result = await SignupInfos.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Sign Up info does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Sign Up Info Id'));
      }
      next(error);
    }
  },
  
  deleteImage: async (req, res, next) => {
    const id = req.params.id;
    const updates = req.body;
    const options = { new: true };

    try {
      const result = await SignupInfos.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Chat topics does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid chat topic id'));
        return;
      }
      next(error);
    }
  }

};