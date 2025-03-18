const createError = require('http-errors');
const mongoose = require('mongoose');

const ChatTopics = require('../../Models/Admin/ChatTopics.model');

module.exports = {
  getChatTopics: async (req, res, next) => {
    try {
      console.log("here is chat topics api controller..")
      const topics = await ChatTopics.findOne({}, {__v: 0, updatedAt: 0});

      if (!topics) {
        const newChatTopics = {
          topic1headline: '',
          topic1content:'',
          topic1image: '',
          topic2headline: '',
          topic2content:'',
          topic2image: '',
          topic3headline: '',
          topic3content:'',
          topic3image: '',
          topic4headline: '',
          topic4content:'',
          topic4image: '',
        };

        const chatTopics2 = new ChatTopics(newChatTopics);
        const chatTopicResult = await chatTopics2.save();

        response = { "success": true, "message": 'data fetched', 'data': chatTopicResult };
        res.json(response);
      } else {

        response = { "success": true, "message": 'data fetched', 'data': topics };
        res.json(response);
      }
    } catch (error) {
      console.log(error);
    }
  },

  updateChatTopics: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };
    
      if (req.files) {

        const files = req.files;

        files.forEach( async (element,index) => {

          if (element.fieldname == 'topicimage1') {   
            req.body.topicimage1 = element.path;
          }

          if (element.fieldname == 'topicimage2') {
            req.body.topicimage2 = element.path;
          }

          if (element.fieldname == 'topicimage3') {
            req.body.topicimage3 = element.path;
          }

          if (element.fieldname == 'topicimage4') {
            req.body.topicimage4 = element.path;
          }

        });
      }

      const result = await ChatTopics.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(404, 'Chat Topics does not exist');
      }
      res.send({
        success: true,
        message: 'Data updated',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Chat Topics Id'));
      }
      next(error);
    }
  },
  
  deleteImage: async (req, res, next) => {
    const id = req.params.id;
    const updates = req.body;
    const options = { new: true };

    try {
      const result = await ChatTopics.findByIdAndUpdate(id, updates, options);
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