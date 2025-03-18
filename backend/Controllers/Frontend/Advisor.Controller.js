const createError = require('http-errors');
const mongoose = require('mongoose');
var ejs = require("ejs");
const path = require('path');
var moment = require('moment-timezone');
var bcrypt = require("bcrypt");
const asyncHandler = require('../../Middleware/asyncHandler');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const Earning = require('../../Models/Earning.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const Service = require('../../Models/Advisor/Service.model');
const GlobalSetting = require('../../Models/GlobalSetting.model');
const Review = require('../../Models/Advisor/Review.model');
const MessagesHistory = require("../../Models/MessageHistory.model");
const CalendarAvailability = require('../../Models/CalendarAvailability.model');
const Nodemailer = require('../../Utils/Nodemailer');
const CalendarBooking = require('../../Models/CalendarBooking.model');
var fs = require('fs');
var ObjectId = require('mongodb').ObjectId;

module.exports = {

  getAdvisors: asyncHandler(async (req, res, next) => {

    /*last two week earning
    total chat count*/

    const results = await AdvisorAuth.find({status: 1, approved: 1, suspended: 0}, { password: 0, tickets: 0, __v: 0, tokens: 0, services: 0, tickets: 0, reviews: 0 });

      let advisorData = [];

      for (let result of results) {

        var d = new Date();
        var d1 = new Date();
        d.setDate(d.getDate() - 15);

        var startDate = new Date(d);
        var endDate = new Date(d1);

        const earnings = await Earning.aggregate(
          [
            {
              $match: { advisor:result._id, createdAt : {$gte: startDate, $lte: endDate } }
            },
            {
              $group:
              {
                _id:null,
                earning: { $sum:"$earning" }
              }
            }
          ]);

        const chatCount = await MessagesHistory.countDocuments({ users:{$in:[result.id]} });

        const advisor = await AdvisorAuth.findById(result.id);

        advisor.total_chats = chatCount;

        if (earnings && earnings[0]) {
          advisor.last_earning = earnings[0].earning,chatCount
        }

        await advisor.save();

      }

  const filter_search = req.query.filter_search
    ? { $or : [
          {
            name: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          },
          {
            username: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          },
          {
            displayname: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          },
          {
            service_name1: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          },
          {
            service_description1: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          },
          {
            service_name2: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          },
          {
            service_description2: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          },
          {
            service_name3: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          },
          {
            service_description3: {
              $regex: req.query.filter_search,
              $options: "i",
            }
          }
        ]
      }
      : {};

    const filer_category = req.query.filer_category
      ? {
        category: req.query.filer_category
      }
      : {};

    var page = parseInt(req.query.page)||1;
    var size = parseInt(req.query.size)||15;

    var query = {}
    
    query.skip = size * (page - 1);
    query.limit = size;

    const sortRate = req.query.sort_rate;
    const searchQuery = req.query.filter_search;


    let sortCon = {
    }

    if (sortRate && sortRate === 'asc') {
      sortCon = {
        rate_per_min: 1
      }
    }else if (sortRate && sortRate == 'desc') {
      sortCon = {
        rate_per_min: -1
      }
    }else{
      sortCon = {
        review_avg: -1,
        last_earning: -1,
        chat_count: -1
      }
    }

    var  totalPosts = await AdvisorAuth.find({...filter_search, ...filer_category, status: 1, approved: 1, suspended: 0}).countDocuments().exec();

    var resultsA = await AdvisorAuth.find({...filter_search, ...filer_category, status: 1, approved: 1, suspended: 0},
      { __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0, password: 0, clients: 0, reviews: 0, tickets: 0, notes: 0, earnings: 0}
      , query).sort(sortCon);
        if(!resultsA) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {

          for (let result of resultsA) {
            
            const global_setting = await GlobalSetting.findOne({});

            var min_chat_minutes = result.min_chat_minutes;

            if (result.min_chat_minutes == 0) {
              min_chat_minutes = global_setting.min_chat_minutes;
            }

            var  discount_period_from = global_setting.discount_period_from;

            var  discount_period_to = global_setting.discount_period_to;

            var  discount_percent = global_setting.discount_percent;

            var todayDate = new Date();
            var dd = String(todayDate.getDate()).padStart(2, '0');
            var mm = String(todayDate.getMonth() + 1).padStart(2, '0');
            var yyyy = todayDate.getFullYear();
            todayDate = yyyy + '-' + mm + '-' + dd;

            const start = new Date(discount_period_from);
            const today = new Date(todayDate);
            const end = new Date(discount_period_to);

            var discontAmt = 0;

            const reviewsCount = await Review.countDocuments({ advisor:result._id});


            if(today >= start && today <= end){
              var discontAmt = parseFloat(result.rate_per_min - ((discount_percent*0.01)*(result.rate_per_min))).toFixed(2);
            }

            const unHappyReviewsCount = await Review.countDocuments({ advisor:result._id, status: 0, approved: 0, createdAt : {$gte: startDate, $lte: endDate } });

            const chatCount = await MessagesHistory.countDocuments({ users:{$in:[result.id]} });
    
            let reviewCount = 5;
            let rem = unHappyReviewsCount -2;
            let no = Math.round((rem*0.1) * 10) / 10
            reviewCount = reviewCount - (no);
    
            const happyReviewsCount = await Review.countDocuments({ advisor:result._id, status: 1, approved: 1, createdAt : {$gte: startDate, $lte: endDate } });
    
    
            if (happyReviewsCount > 3) {
    
              let remH = happyReviewsCount -3;
    
              let no1 = Math.round((remH*0.1) * 10) / 10
    
              reviewCount = reviewCount + no1;
            }
    
            reviewCount = Math.round(reviewCount*10) /10;
    
            if (reviewCount > 5 ) {
              reviewCount = 5;
            }
    

            advisorData.push({
              _id: result._id,
              name: result.name,
              avatar: result.avatar,
              username: result.username,
              displayname: result.displayname,
              rate_per_min: result.rate_per_min,
              min_chat_minutes: min_chat_minutes,
              disconted_rate: discontAmt,
              commission_rate: result.commission_rate,
              unlimited_minutes: result.unlimited_minutes,
              email: result.email,
              status: result.status,
              approved: result.approved,
              createdAt: result.createdAt,
              description: result.description,
              dob: result.dob,
              rating_avg: reviewCount,
              // total_chats: result.total_chats,
              total_chats: result.chat_count,
              total_reviews: reviewsCount,
              chat_status: result.chat_status || 0,
              chat_engage: result.chat_engage || 0,
              free_30_minutes: result.free_30_minutes,
              avail_free_mins: result.avail_free_mins
            });            

          }


          /*const ArrData = [];

          //  3rd, 1st, 2nd, 4th
          //  7rd, 5st, 6nd, 8th

          if (advisorData && advisorData[3]) {
            ArrData[0] = advisorData[3];
          }
          if (advisorData && advisorData[1]) {
            ArrData[1] = advisorData[1];
          }
          if (advisorData && advisorData[2]) {
            ArrData[2] = advisorData[2];
          }
          if (advisorData && advisorData[4]) {
            ArrData[3] = advisorData[4];
          }
          if (advisorData && advisorData[7]) {
            ArrData[4] = advisorData[7];
          }
          if (advisorData && advisorData[5]) {
            ArrData[5] = advisorData[5];
          }
          if (advisorData && advisorData[6]) {
            ArrData[6] = advisorData[6];
          }
          if (advisorData && advisorData[8]) {
            ArrData[7] = advisorData[8];
          }*/

          response = {"success": true, "message": 'data fetched', 'data': advisorData, 'page': page, 'total': totalPosts, perPage:size };
        }
        res.json(response);
  }),

  getAllAdvisors: async (req, res, next) => {
    try {
      const results = await AdvisorAuth.find({status: 1, approved: 1, suspended: 0, show_on_home: 1}).sort({ position : 1}).limit(8);
      // const results = await AdvisorAuth.find({status: 1, approved: 1, suspended: 0}, { password: 0, tickets: 0, __v: 0, tokens: 0, services: 0, tickets: 0, reviews: 0 }).sort({ 'position' : 1});

      let advisorData = [];

      for (let result of results) {

        var d = new Date();
        var d1 = new Date();
        d.setDate(d.getDate() - 15);

        var startDate = d.toISOString();
        var endDate = d1.toISOString();

        const unHappyReviewsCount = await Review.countDocuments({ advisor:result._id, status: 0, approved: 0, createdAt : {$gte: startDate, $lte: endDate } });

        const chatCount = await MessagesHistory.countDocuments({ users:{$in:[result.id]} });

        let reviewCount = 5;
        let rem = unHappyReviewsCount -2;
        let no = Math.round((rem*0.1) * 10) / 10
        reviewCount = reviewCount - (no);

        const happyReviewsCount = await Review.countDocuments({ advisor:result._id, status: 1, approved: 1, createdAt : {$gte: startDate, $lte: endDate } });


        if (happyReviewsCount > 3) {

          let remH = happyReviewsCount -3;

          let no1 = Math.round((remH*0.1) * 10) / 10

          reviewCount = reviewCount + no1;
        }

        reviewCount = Math.round(reviewCount*10) /10;

        if (reviewCount > 5 ) {
          reviewCount = 5;
        }

        var min_chat_minutes = result.min_chat_minutes;

        const global_setting = await GlobalSetting.findOne({});
        if (result.min_chat_minutes == 0) {
          min_chat_minutes = global_setting.min_chat_minutes;
        }

        var  discount_period_from = global_setting.discount_period_from;

        var  discount_period_to = global_setting.discount_period_to;

        var  discount_percent = global_setting.discount_percent;


        var todayDate = new Date();
        var dd = String(todayDate.getDate()).padStart(2, '0');
        var mm = String(todayDate.getMonth() + 1).padStart(2, '0');
        var yyyy = todayDate.getFullYear();
        todayDate = yyyy + '-' + mm + '-' + dd;

        const start = new Date(discount_period_from);
        const today = new Date(todayDate);
        const end = new Date(discount_period_to);

        var discontAmt = 0;

        if(today >= start && today <= end){
          var discontAmt = parseFloat(result.rate_per_min - ((discount_percent*0.01)*(result.rate_per_min))).toFixed(2);
        }

        advisorData.push({
          _id: result._id,
          name: result.name,
          avatar: result.avatar,
          username: result.username,
          displayname: result.displayname,
          rate_per_min: result.rate_per_min,
          disconted_rate: discontAmt,
          commission_rate: result.commission_rate,
          unlimited_minutes: result.unlimited_minutes,
          email: result.email,
          status: result.status,
          approved: result.approved,
          createdAt: result.createdAt,
          description: result.description,
          dob: result.dob,
          chat_status: result.chat_status || 0,
          chat_engage: result.chat_engage || 0,
          free_30_minutes: result.free_30_minutes,
          avail_free_mins: result.avail_free_mins,
          rating_avg: (reviewCount > 4.5) ? 5 : reviewCount,
          unhappy_review_count: unHappyReviewsCount,
          happy_review_count: happyReviewsCount,
          chat_count: result.chat_count,
          min_chat_minutes : (min_chat_minutes == 0) ? 5 : min_chat_minutes
        })
      }

      // gdgd

      // const advisorDataNew =  await  advisorData.sort((a,b) => b.rating_avg - a.rating_avg);

      res.send({
        success: true,
        message: 'user fetched!',
        data: advisorData
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  getAdvisorChatStatus: async (req, res, next) => {
    try {

      const advisor = await AdvisorAuth.findById(req.params.id);

      return res.send({
        success: true,
        message: 'Details fetched!',
        status: advisor.chat_engage,
        advisor_name: advisor.name
      });

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },


   getAdvisorChatStatusByid: async (req, res, next) => {
    try {

      const advisor = await AdvisorAuth.findById(req.params.id);

      return res.send({
        success: true,
        message: 'Details fetched!',
        chat_engage_status: advisor.chat_engage,
        advisor_name: advisor.username
      });

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  profileImages: async (req, res, next) => {
    try {

      const client = await ClientAuth.findById(req.body.client_id);

      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

      return res.send({
        success: true,
        message: 'Client Advisor fetched!',
        client_profile: client.avatar,
        client_username: client.username,
        advisor_profile: advisor.avatar,
        advisor_username: advisor.username,
        client_name: client.name,
        advisor_name: advisor.name
      });

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },


  getAdvisorServices: async (req, res, next) => {
    const id = req.params.id;
    try {

      const services = await Service.findOne({advisor: id}, {__v: 0, updatedAt: 0});
      if (!services) {

        const advisor = await AdvisorAuth.findById(id);

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
      console.log(error);
    }
  

  },

  addClientsAdvisors: async (req, res, next) => {
    try {

      const client = await ClientAuth.findById(req.body.client_id);

      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

      client.advisors.pull(req.body.advisor_id);
      await client.save();

      client.advisors.push(req.body.advisor_id);
      await client.save();

      advisor.clients.pull(req.body.client_id);
      await advisor.save();

      advisor.clients.push(req.body.client_id);
      await advisor.save();

      const clientData = await ClientAuth.findById(req.body.client_id, { name: 1, email: 1, mobile: 1 }).populate('advisors', 'name email mobile');

      const advisorData = await AdvisorAuth.findById(req.body.advisor_id, { name: 1, email: 1, mobile: 1 }).populate('clients', 'name email mobile');

      return res.send({
        success: true,
        message: 'Client Advisor added successfully!',
        client: clientData,
        advisor: advisorData,
      });

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  sendClientsAdvisorsChatLogs: async (req, res, next) => {
    try {

      const client = await ClientAuth.findById(req.body.client_id);

      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

       const { client_id, advisor_id } = req.body;
      
       var absoluteBasePath = path.resolve('');

      /*const messages = await MessagesHistory.find({ users:{$all:[client_id, advisor_id]} }).sort({ $natural: -1 });

      const projectedMessages = await messages.map((msg) => {
        return {
          from: msg.users[0],
          to: msg.users[1],
          msg: msg.message.text,
          doc: msg.doc,
          createdAt: (msg.createdAt).toLocaleDateString() +' '+ (msg.createdAt).toLocaleTimeString()
        };
      });*/


      const projectedMessages = req.body.messages;
      console.log("+++++++++++++++++++++++++++++++ this is chat log messages ++++++++++++++++++++++++++++");
      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;

      const adnameLink  =  'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name='+advisor.username;
      const clnameLink  =  'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name='+client.username;
      let advisorTz = projectedMessages.filter(m => (m.advisorTimezone != null && m.advisorTimezone != '' ))[0].advisorTimezone;
      
      const htmlAdvisor = await ejs.renderFile(absoluteBasePath+"/views/advisor_chat_log.ejs", {logo:logo,adnameLink:adnameLink,clnameLink:clnameLink,advisor: advisor.username, client: client.username, msgFrom: req.body.advisor_id, projectedMessages:projectedMessages,moment: moment, tz: advisorTz});
      let clientTz = projectedMessages.filter(m => (m.clientTimezone != null && m.clientTimezone != '' ))[0].clientTimezone;
      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ this is advisor html ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
      console.log(htmlAdvisor);
      await Nodemailer.sendChatLogNotification(
        advisor.username,
        advisor.email,
        client.username,
        client.email,
        htmlAdvisor
      );

      const htmlClient = await ejs.renderFile(absoluteBasePath+"/views/client_chat_log.ejs", {logo:logo,adnameLink:adnameLink,clnameLink:clnameLink,advisor: advisor.username, client: client.username, msgFrom: req.body.client_id, projectedMessages:projectedMessages,moment: moment, tz: clientTz});
      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ this is client html ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
      console.log(htmlClient);
      await Nodemailer.sendChatLogNotification(
        client.username,
        client.email,
        advisor.username,
        advisor.email,
        htmlClient
      );

      return res.send({
        success: true,
        message: 'Client Advisor added successfully!',
        client: client,
        advisor: advisor,
      });

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },


  sendAdvisorChatMail: async (req, res, next) => {
    try {

      const global_setting = await GlobalSetting.findOne();

      const keywords = global_setting.tracking_keywords.split(',');


      const { client_id, advisor_id } = req.body;

      /*const messages = await MessagesHistory.find({ users:{$all:[client_id, advisor_id]} }).sort({ $natural: -1 });

      const projectedMessages = await messages.map((msg) => {
        return {

          from: msg.users[0],
          to: msg.users[1],
          msg: msg.message.text,
          doc: msg.doc,
          createdAt: (msg.createdAt).toLocaleDateString() +' '+ (msg.createdAt).toLocaleTimeString()
        };
      });*/

      const projectedMessages = req.body.messages;

      let found = false;
      let keywordFound = '';

      keywords.forEach(function(keyword) {

        let obj = projectedMessages.find(o => o.msg === keyword);

        if (obj && obj !== undefined) {
          found = true;
          keywordFound = keyword;
        }
      });

     // send mail if keyword found

      /*if (found) {
        const client = await ClientAuth.findById(req.body.client_id);

        const advisor = await AdvisorAuth.findById(req.body.advisor_id);

        var absoluteBasePath = path.resolve('');

        const adnameLink  =  'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name='+advisor.username;
        const clnameLink  =  'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name='+client.username;  

        const htmlAdvisor = await ejs.renderFile(absoluteBasePath+"/views/advisor_chat.ejs", {adnameLink:adnameLink,clnameLink:clnameLink, advisor: advisor.username, client: client.username, keyword: keywordFound, msgFrom: req.body.client_id, projectedMessages:projectedMessages});

        Nodemailer.sendChatLogKeywordNotification(
          advisor.username,
          advisor.email,
          client.username,
          client.email,
          htmlAdvisor
          );
      }*/


      /*return res.json({
        global_setting: global_setting.tracking_keywords.split(','),
        projectedMessages
      })
*/

      return res.send({
        success: true,
        message: 'Mail sended successfully!!'
      });

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  updateAdvisorService: async (req, res, next) => {

    try {
      const id = req.params.id;
      const updates = req.body;
      const options = { new: true };

      const advisorId = req.body.advisor_id;

      const advisor = await AdvisorAuth.findById(advisorId);

      if (!advisor) {
        throw createError(404, 'advisor does not exist');
      }

      advisor.service = id;
      await advisor.save();

      const result = await Service.findOneAndUpdate({_id: id, advisor: advisor.id}, updates, options);
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
      console.log(error);
      if (error instanceof mongoose.CastError) {
        return next(createError(400, 'Invalid Service Id'));
      }
      next(error);
    }
  
  },


  updateAdvisor: async (req, res, next) => {

    const id = req.params.id;
    const newArray = [];

    console.log(req.body);

    try {

      if (req.files) {

        const files = req.files;

        files.forEach( async (element,index) => {

          if (element.fieldname == 'gov_photo_id_front') {
            // fs.unlinkSync(filePath);      
            req.body.gov_photo_id_front = element.path;
          }

          if (element.fieldname == 'gov_photo_id_backend') {
            req.body.gov_photo_id_backend = element.path;
          }

          if (element.fieldname == 'us_tax_norms') {
            req.body.us_tax_norms = element.path;
          }

          if (element.fieldname == 'avatar') {
            req.body.avatar = element.path;
          }

          if (element.fieldname == 'certificate') {
            newArray.push(element.path);
          }

        });

      }

      if(newArray.length > 0) {
        req.body.certificate = newArray;
      }

      if(req.body.password) {
        req.body.password = bcrypt.hashSync(req.body.password, 8);
      }

      const global_setting = await GlobalSetting.findOne({});
      const min_rate_per_minute = global_setting.min_rate_per_minute||0;
      const max_rate_per_minute = global_setting.max_rate_per_minute||100;

      var  discount_period_from = global_setting.discount_period_from;
      var  discount_period_to = global_setting.discount_period_to;

      const start = Date.parse(discount_period_from);
      const d = Date.now();
      const end = Date.parse(discount_period_to);

      if(d >= start && d <= end){
        //throw createError(201, 'You are not allowed to change rate now due to cause of promotional period till date (promotional end date).');
      }

      if ((req.body.rate_per_min <= min_rate_per_minute) || (req.body.rate_per_min >= max_rate_per_minute)) {
        //throw createError(201, `Per min Rate is not allowed by admin ( set b/w ${min_rate_per_minute} and ${max_rate_per_minute}), please contact admin!`);
      }

      const updates = req.body;

      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }

      const customer = await AdvisorAuth.findById(id);

      if (customer.rate_per_min > 0 || customer.mobile > 0 || customer.marketing_intro > 0 || customer.avatar > 0 || customer.description > 0 || customer.rate_per_min > 0 ) {
        const options = { new: true };
        const result = await AdvisorAuth.findByIdAndUpdate(id, {user_status : 1}, options);
        if (!result) {
          throw createError(201, 'Auth does not exist');
        }
      }

      return res.send({
        success: true,
        message: 'Data updated!',
        data: result
      });
    } catch (error) {
      console.log(error);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  findCalendarAvailabilityByAdvisor: async (req, res, next) => {
    const id = req.params.id;
    try {
      const calendar_availability = await CalendarAvailability.find({advisor: id},{__v: 0, updatedAt: 0}).populate('advisor','username email mobile').populate('client','username email mobile');
      if (!calendar_availability) {
        throw createError(404, 'CalendarAvailability does not exist.');
      }
      res.send({
        success: true,
        message: 'Data fetched',
        data: calendar_availability
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(400, 'Invalid CalendarAvailability id'));
        return;
      }
      next(error);
    }
  },

  getAdvisor: async (req, res, next) => {
    try {

      const id = req.params.id;

      var d = new Date();
      var d1 = new Date();
      d.setDate(d.getDate() - 15);

      var startDate = d.toISOString();
      var endDate = d1.toISOString();

      const unHappyReviewsCount = await Review.countDocuments({ advisor:id, status: 0, approved: 0, createdAt : {$gte: startDate, $lte: endDate } });

      const chatCount = await MessagesHistory.countDocuments({ users:{$in:[id]} });

      let reviewCount = 5;
      let rem = unHappyReviewsCount -2;
      let no = Math.round((rem*0.1) * 10) / 10
      reviewCount = reviewCount - (no);

      const happyReviewsCount = await Review.countDocuments({ advisor:id, status: 1, approved: 1, createdAt : {$gte: startDate, $lte: endDate } });

      let no1 = Math.round((happyReviewsCount*0.1) * 10) / 10

      reviewCount = reviewCount + no1;

      reviewCount = Math.round(reviewCount*10) /10;

      if (reviewCount > 5 ) {
        reviewCount = 5;
      }

      const result = await AdvisorAuth.findById(id, { password: 0, tickets: 0, __v: 0, tokens: 0 })
      .populate({ path: 'reviews', match: { status: 1, approved: 1 }, options: { sort: { $natural: -1 } }, select: 'client_name review rating createdAt approved status', populate: { path: 'client', select: 'name avatar username' } })
      .populate({ path: 'reviews', match: { status: 1, approved: 1 }, options: { sort: { $natural: -1 } }, populate: { path: 'advisor', select: 'name avatar username' } })
      .populate('service');


      var min_chat_minutes = result ? result.min_chat_minutes : 0;
      const global_setting = await GlobalSetting.findOne({});
      if (result && result.min_chat_minutes == 0) {
        min_chat_minutes = global_setting.min_chat_minutes;
      }

      var globalCommRate = 0;
      if(result && result.commission_rate == 0) {
        globalCommRate = global_setting.commission_rate;
      }

      var  discount_period_from = global_setting.discount_period_from;

      var  discount_period_to = global_setting.discount_period_to;

      var  discount_percent = global_setting.discount_percent;


      var todayDate = new Date();
      var dd = String(todayDate.getDate()).padStart(2, '0');
      var mm = String(todayDate.getMonth() + 1).padStart(2, '0');
      var yyyy = todayDate.getFullYear();
      todayDate = yyyy + '-' + mm + '-' + dd;

      const start = new Date(discount_period_from);
      const today = new Date(todayDate);
      const end = new Date(discount_period_to);

      var discontAmt = 0;

      if(today >= start && today <= end){
        var discontAmt = parseFloat(result.rate_per_min - ((discount_percent*0.01)*(result.rate_per_min))).toFixed(2);
      }

      res.send({
        success: true,
        message: 'user fetched!',
        data: result,
        disconted_rate: discontAmt,
        globalCommRate:globalCommRate,
        rating_avg: reviewCount,
        unhappy_review_count: unHappyReviewsCount,
        happy_review_count: happyReviewsCount,
        chat_count: result ? result.chat_count : 0,
        min_chat_minutes : (min_chat_minutes == 0) ? 5 : min_chat_minutes
      });
      
    } catch (error) {
      console.log(error);
    }
  },

  getCalendarAvailabilityBooked: async (req, res, next) => {
    try {
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      CalendarBooking.find({client: req.params.id, date: { $gte: today }}, {__v:0, updatedAt: 0}, function (err, data) {
          if (err) {
            response = { "error": true, "message": "Error fetching data" + err };
          } else {
            response = { "success": true, "message": 'data fetched', 'data': data};
          }
          res.json(response);
        }).sort({ $natural: -1 }).populate('client','name username email mobile').populate('advisor', 'name username email mobile');
    } catch (error) {
      console.log(error.message);
    }
  },

};

/*
        let avgCount = 0;

        const review_avg = await Review.aggregate([
          {
            $match:
              { advisor: result._id, status: 1 }
          },
          { "$group": { _id: { advisor: "$advisor" }, "rating": { "$avg": "$rating" } } }
        ]);

        if (review_avg && review_avg.length > 0) {
          avgCount = review_avg[0].rating;
        }*/

            /*  let avgCount = 0;

      const review_avg = await Review.aggregate(
        [
          {
            $match: { advisor: result._id, status: 1 }
          },
          {
            $group: {
              _id: { advisor: "$advisor" },
              rating: { "$avg": "$rating" }
            }
          }
        ]
      );



      if (review_avg && review_avg.length > 0) {
        avgCount = review_avg[0].rating;
      }*/