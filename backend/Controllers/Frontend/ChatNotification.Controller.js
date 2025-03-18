const createError = require('http-errors');
const mongoose = require('mongoose');

const asyncHandler = require('../../Middleware/asyncHandler');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const ChatNotification = require('../../Models/Advisor/Chatnotification.model');
const Nodemailer = require('../../Utils/Nodemailer');
const path = require('path')
const ejs = require('ejs');
const GlobalSetting = require('../../Models/GlobalSetting.model')

module.exports = {


  InsertChatOffLineNotification: async (req, res, next) => {
    try {

      var absoluteBasePath = path.resolve('');

      const client = await ClientAuth.findById(req.body.client_id);

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      client.notifiedOn = today;

      await client.save();

      console.log('client.notifiedOn',client.notifiedOn)

      const then = new Date(client.notifiedOn);
      const now = new Date();

      const msBetweenDates = Math.abs(then.getTime() - now.getTime());

      const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000);

      if (hoursBetweenDates < 24) {
        console.log('date is within 24 hours');
      } else {
        console.log('date is NOT within 24 hours');

        const advisor = await AdvisorAuth.findById(req.body.advisor_id);
        const logoData = await GlobalSetting.findOne({});
        const logo = process.env.BASE_URL+'/api/'+logoData.logo;

        const html = await ejs.renderFile(absoluteBasePath+"/views/chat_offline.ejs", {logo:logo,name: advisor.username, email: advisor.email, client: client.username, client_email: client.email});

        await Nodemailer.ChatOnlineMailNotification(
          advisor.username,
          advisor.email,
          advisor.email,
          client.username,
          client.email,
          html
        );  

      }           

      res.status(200)
      .send({
        success: true,
        message: "Notification has been sent",
      });      

    } catch (error) {
      console.log(error.message);
    }
  },


  InsertChatNotification: async (req, res, next) => {
    try {
        
        const data = new ChatNotification({
            advisor_id: req.body.advisor_id,
            client_id: req.body.client_id
        });

        var absoluteBasePath = path.resolve('');

        const client = await ClientAuth.findById(req.body.client_id);
        const logoData = await GlobalSetting.findOne({});
        const advisor = await AdvisorAuth.findById(req.body.advisor_id);
        const logo = process.env.BASE_URL+'/api/'+logoData.logo;

        const html = await ejs.renderFile(absoluteBasePath+"/views/chat_online.ejs", {logo:logo,name: advisor.username, email: advisor.email, client: client.username, client_email: client.email});

        // send email to advisor
        await Nodemailer.ChatOnlineMailNotification(
          advisor.username,
          advisor.email,
          client.username,
          client.email,
          html
        );
          
        const notificationExists = await ChatNotification.find({ advisor_id: req.body.advisor_id , client_id: req.body.client_id });

        if(notificationExists.length == 0) {
            data.save((err, result) => {
                if(err) {
                    res.status(500)
                        .send({
                        message: err
                        });
                    return;
                } else {
                    res.status(200)
                    .send({
                        success: true,
                        message: "Notification has been sent",
                        data : result
                    });
                }
            });  
        } else {

          const deletePrevious = await ChatNotification.deleteMany( { "advisor_id": req.body.advisor_id }, { "cient_id" : req.body.client_id });

          data.save((err, result) => {
            if(err) {
                res.status(500)
                    .send({
                    message: err
                    });
                return;
            } else {
                res.status(200)
                .send({
                    success: true,
                    message: "Notification has been sent",
                    data : result
                });
            }
        }); 
        }
        
             
          
    } catch (error) {
        console.log(error.message);
    }
  },


  deleteNotification: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await ChatNotification.findByIdAndDelete(id);

      res.send({
        success: true,
        message: 'Data deleted',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid Notification id'));
        return;
      }
      next(error);
    }
  },

  getnotificationForClients: async (req, res, next) => {
    const id = req.params.id;
    try {
    
      const result = await ChatNotification.find({client_id:id});

      if (!result) {
        throw createError(201, 'There is no notifications found.');
      }
      res.send({
        status: 200,
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Advisor id'));
        return;
      }
      next(error);
    }
  },

  getAdvisorChatEnagaeStatus: async (req, res, next) => {
    const id = req.params.id;
    try {
    
      const result = await AdvisorAuth.find({status: 1, approved: 1 , _id:id}, { chat_engage: 1 });

      res.send({
        status: 200,
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Advisor id'));
        return;
      }
      next(error);
    }
  },

};