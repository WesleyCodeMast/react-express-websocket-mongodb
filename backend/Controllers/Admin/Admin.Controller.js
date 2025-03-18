const createError = require('http-errors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Nodemailer = require('../../Utils/Nodemailer')
var bcrypt = require("bcrypt");
const path = require('path')
const ejs = require('ejs');
const asyncHandler = require('../../Middleware/asyncHandler')
const GlobalSetting = require('../../Models/GlobalSetting.model');
const Auth = require('../../Models/Admin/Auth.model');
const ClientAuth = require('../../Models/Client/Auth.model');
const UserAuth = require('../../Models/Admin/Auth.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const AuthDeleted = require('../../Models/Advisor/AuthDeleted.model');
const Ticket = require('../../Models/Ticket.model');
const Earning = require('../../Models/Earning.model');
const Notification = require('../../Models/Notification.model');
const FreeMinute = require('../../Models/FreeMinute.model');

const Promotion = require('../../Models/Promotion.model');

const Validator = require('validatorjs');

const sendEmailCommission = require('../../Utils/sendEmailCommission')
const sendClientNotification = require('../../Utils/sendClientNotification')

async function checkNameIsUnique(name) {

  totalPosts = await AdvisorAuth.countDocuments({ username: name });
  if (totalPosts > 0) {
    return true;
  } else {
    return false;
  }
};

async function checkEmailIsUnique(email) {

  totalPosts = await AdvisorAuth.countDocuments({ email: email });
  if (totalPosts > 0) {
    return true;
  } else {
    return false;
  }
};


async function checkUserNameIsUnique(name) {

  totalPosts = await UserAuth.countDocuments({ username: name });
  if (totalPosts > 0) {
    return true;
  } else {
    return false;
  }
};

async function checkUserEmailIsUnique(email) {

  totalPosts = await UserAuth.countDocuments({ email: email });
  if (totalPosts > 0) {
    return true;
  } else {
    return false;
  }
};

module.exports = {

  getAllAdmins: asyncHandler(async (req, res, next) => {

    const filter_created_at = req.query.filter_created_at
      ? {
        addedAt: {
          $regex: req.query.filter_created_at
        }
      }
      : {};


    const filter_name = req.query.filter_name
        ? {
          name: {
            $regex: req.query.filter_name,
            $options: "i",
          },
        }
        : {};

      const filter_email = req.query.filter_email
        ? {
          email: {
            $regex: req.query.filter_email,
            $options: "i",
          },
        }
        : {};

      const filter_mobile = req.query.filter_mobile
        ? {
          mobile: {
            $regex: req.query.filter_mobile,
            $options: "i",
          }
        }
        : {};

    const filter_status = req.query.filter_status
      ? {
        status: req.query.filter_status
      }
      : {};

    var page = parseInt(req.query.page)||1;
    var size = parseInt(req.query.size)||15;

    var query = {}
    
    query.skip = size * (page - 1);
    query.limit = size;

    var  totalPosts = await Auth.find({...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name}).countDocuments().exec();

    Auth.find({...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name},{ __v: 0, updatedAt: 0, tokens: 0},
      query,function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage:size };
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),

  getAllUsers: asyncHandler(async (req, res, next) => {

    const filter_created_at = req.query.filter_created_at
      ? {
        addedAt: {
          $regex: req.query.filter_created_at
        }
      }
      : {};

    const filter_name = req.query.filter_name
        ? {
          name: {
            $regex: req.query.filter_name,
            $options: "i",
          },
        }
        : {};

    const filter_username = req.query.filter_username
        ? {
          username: {
            $regex: req.query.filter_username,
            $options: "i",
          },
        }
        : {};

      const filter_email = req.query.filter_email
        ? {
          email: {
            $regex: req.query.filter_email,
            $options: "i",
          },
        }
        : {};

      const filter_mobile = req.query.filter_mobile
        ? {
          mobile: {
            $regex: req.query.filter_mobile,
            $options: "i",
          }
        }
        : {};

    const filter_status = req.query.filter_status
      ? {
        status: req.query.filter_status
      }
      : {};

    var page = parseInt(req.query.page)||1;
    var size = parseInt(req.query.size)||15;

    var query = {}
    
    query.skip = size * (page - 1);
    query.limit = size;

    var  totalPosts = await UserAuth.find({...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name, ...filter_username}).countDocuments().exec();

    UserAuth.find({...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name, ...filter_username},{ __v: 0, updatedAt: 0, tokens: 0},
      query,function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage:size };
        }
        res.json(response);
      }).populate('group').sort({ $natural: -1 });
  }),


  getAllClients: asyncHandler(async (req, res, next) => {

    const filter_created_from = req.query.filter_created_to
      ? {
        createdAt : {$gte: req.query.filter_created_from, $lte: req.query.filter_created_to}
      }
      : {};

    const filter_name = req.query.filter_name
        ? {
          name: {
            $regex: req.query.filter_name,
            $options: "i",
          },
        }
        : {};

    const filter_username = req.query.filter_username
        ? {
          username: {
            $regex: req.query.filter_username,
            $options: "i",
          },
        }
        : {};

      const filter_email = req.query.filter_email
        ? {
          email: {
            $regex: req.query.filter_email,
            $options: "i",
          },
        }
        : {};

      const filter_mobile = req.query.filter_mobile
        ? {
          mobile: {
            $regex: req.query.filter_mobile,
            $options: "i",
          }
        }
        : {};

    const filter_status = req.query.filter_status
      ? {
        status: req.query.filter_status
      }
      : {};

    var page = parseInt(req.query.page)||1;
    var size = parseInt(req.query.size)||15;

    var query = {}
    
    query.skip = size * (page - 1);
    query.limit = size;

    var  totalPosts = await ClientAuth.find({...filter_created_from, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name, ...filter_username}).countDocuments().exec();

    ClientAuth.find({...filter_created_from, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name, ...filter_username},{ __v: 0, updatedAt: 0, tokens: 0},
      query,function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage:size };
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),

  getAllAdvisors: asyncHandler(async (req, res, next) => {

    const filter_created_from = req.query.filter_created_to
      ? {
        createdAt : {$gte: req.query.filter_created_from, $lte: req.query.filter_created_to}
      }
      : {};


    const filter_name = req.query.filter_name
        ? {
          name: {
            $regex: req.query.filter_name,
            $options: "i",
          },
        }
        : {};

    const filter_username = req.query.filter_username
        ? {
          username: {
            $regex: req.query.filter_username,
            $options: "i",
          },
        }
        : {};

      const filter_email = req.query.filter_email
        ? {
          email: {
            $regex: req.query.filter_email,
            $options: "i",
          },
        }
        : {};

      const filter_mobile = req.query.filter_mobile
        ? {
          mobile: {
            $regex: req.query.filter_mobile,
            $options: "i",
          }
        }
        : {};

     var filter_status = '';  
     if(req.query.filter_status === 'notapproved') {
        filter_status = req.query.filter_status

        ? {
          approved: req.query.filter_status
        }
        : {};
     }   else {
        filter_status = req.query.filter_status

        ? {
          status: req.query.filter_status
        }
        : {};
     } 



    var page = parseInt(req.query.page)||1;
    var size = parseInt(req.query.size)||15;

    var query = {}
    
    query.skip = size * (page - 1);
    query.limit = size;

    var  totalPosts = await AdvisorAuth.find({...filter_created_from, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name, ...filter_username}).countDocuments().exec();

    AdvisorAuth.find({...filter_created_from, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name, ...filter_username},{ __v: 0, updatedAt: 0, tokens: 0},
      query,function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage:size };
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),

  findAdminById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await Auth.findById(id, { __v: 0, updatedAt: 0, tokens: 0});
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      return res.send({
        success: true,
        message: 'Data fetched',
        data: auth
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  getDashboardData: async (req, res, next) => {
    const id = req.params.id;
    try {
      const client_counts = await ClientAuth.countDocuments();
      const clients = await ClientAuth.find({}, { __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0, password: 0}).sort({ $natural: -1 }).limit(2);
      const advisor_counts = await AdvisorAuth.countDocuments();
      const advisors = await AdvisorAuth.find({}, { __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0, password: 0}).sort({ $natural: -1 }).limit(2);
      const ticket_counts = await Ticket.countDocuments();
      const tickets = await Ticket.find({}, { __v: 0, updatedAt: 0}).sort({ $natural: -1 }).limit(4);

      const totals = await Earning.aggregate([
          [{$group : {_id : null, totlCom : {$sum : "$earning"}}}]
        ]);

      res.send({
        success: true,
        message: 'Data fetched',
        data : {
          customers : clients,
          customers_count : client_counts,
          earning : (totals && totals[0]) ? parseFloat(totals[0].totlCom).toFixed(2) : 0,
          advisors : advisors,
          advisors_count : advisor_counts,
          tickets : tickets,
          tickets_count : ticket_counts,
        }
      });

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  createNewAdvisor: async (req, res, next) => {
    try {

      let rules = {
        name: 'required',
        username: 'required',
        email: 'required',
        dob: 'required',
        rate_per_min: 'required'
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(412).send({
          success: false,
          message: 'Validation failed',
          data: validation.errors
        });
      }

      var checkCountEmail = await checkEmailIsUnique(req.body.email);

      if (checkCountEmail) {
        return res.status(412)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate email'
        });
      }

      var checkCountName = await checkNameIsUnique(req.body.username);

      if (checkCountName) {
        return res.status(412)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate username'
        });
      }


      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      const password = req.body.password || 'password';

      const token = jwt.sign({email: req.body.email}, process.env.JWT_SEC_TOKEN);

      const user = new AdvisorAuth({
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        displayname: req.body.name,
        rate_per_min: req.body.rate_per_min,
        dob: req.body.dob,
        addedAt: today,
        password: bcrypt.hashSync(password, 8),
        confirmationCode: token
      });

      user.save((err, user) => {
        if (err) {
          res.status(500)
          .send({
            message: err
          });
          return;
        } else {
          res.status(200)
          .send({
            success: true,
            message: "User Registered successfully",
            data: user
          })
        }
      });

    } catch (error) {
      console.log(error);
      if (error.name === 'ValidationError') {
        next(createError(201, error.message));
        return;
      }
      next(error);
    }
  },

  createNewUser: async (req, res, next) => {
    try {

      let rules = {
        name: 'required',
        username: 'required',
        email: 'required',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(412).send({
          success: false,
          message: 'Validation failed',
          data: validation.errors
        });
      }

      var checkUserCountEmail = await checkUserEmailIsUnique(req.body.email);

      if (checkUserCountEmail) {
        return res.status(412)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate email'
        });
      }

      var checkUserCountName = await checkUserNameIsUnique(req.body.username);

      if (checkUserCountName) {
        return res.status(412)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate username'
        });
      }


      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      const password = req.body.password || 'password';

      const user = new UserAuth({
        name: req.body.name,
        mobile: req.body.mobile,
        status: req.body.status,
        group: req.body.group,
        email: req.body.email,
        user_type: req.body.user_type || 'staff',
        username: req.body.username,
        addedAt: today,
        password: bcrypt.hashSync(password, 8)
      });

      user.save((err, user) => {
        if (err) {
          res.status(500)
          .send({
            message: err
          });
          return;
        } else {
          res.status(200)
          .send({
            success: true,
            message: "User Registered successfully",
            data: user
          })
        }
      });

    } catch (error) {
      console.log(error);
      if (error.name === 'ValidationError') {
        next(createError(201, error.message));
        return;
      }
      next(error);
    }
  },

  findClientById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await ClientAuth.findById(id, { __v: 0, updatedAt: 0, tokens: 0}).populate('tickets');
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      return res.send({
        success: true,
        message: 'Data fetched',
        data: auth
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },


   findUserById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await UserAuth.findById(id, { __v: 0, updatedAt: 0, tokens: 0});
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      return res.send({
        success: true,
        message: 'Data fetched',
        data: auth
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  sendCreditLinkEmail: async (req, res, next) => {

    try {

      const token = jwt.sign({email: req.body.email, customer_id: '', amount: req.body.amount}, process.env.JWT_SEC_TOKEN);

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

       const notifications = {
        email: req.body.email,
        minutes: req.body.amount,
        addedAt: today      
      }

      const notification = new FreeMinute(notifications);
      const notification_result = await notification.save();

      var absoluteBasePath = path.resolve('');

      const link = process.env.BASE_URL+'/client-signup';
      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;
      const html = await ejs.renderFile(absoluteBasePath+"/views/credit_link_email.ejs", { logo:logo,client: req.body.email, client_email: req.body.email, token, link});

      Nodemailer.sendCreditLink(
        req.body.email,
        req.body.email,
        token,
        html
      );

      return res.send({
        success: true,
        message: 'User credit link sent sucessfully!',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  sendCreditLink: async (req, res, next) => {
    const id = req.params.id;
    try {

      const client = await ClientAuth.findById(id);

      const token = jwt.sign({email: client.email, customer_id: client.id, amount: req.body.amount}, process.env.JWT_SEC_TOKEN);

      client.confirmationCode = token;

      await client.save();

      var absoluteBasePath = path.resolve('');

      const link = process.env.BASE_URL+'/confirm-credit-link/'+token;
      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;
      const html = await ejs.renderFile(absoluteBasePath+"/views/credit_link.ejs", { logo:logo,client: client.username, client_email: client.email, token, link});

      Nodemailer.sendCreditLink(
        client.username,
        client.email,
        token,
        html
      );

      return res.send({
        success: true,
        message: 'User credit link sent sucessfully!',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  updatePromotionAmount: async (req, res, next) => {
    const id = req.params.id;
    try {

      const promotions = await Promotion.find({ client: req.body.client_id , advisor: req.body.advisor_id });

      var delteId = '';
      promotions.map((item) => {
        delteId =  item._id;
      })

      const newData = {
        client: req.body.client_id,
        advisor: req.body.advisor_id,
        amount: parseFloat(req.body.chatAmount)      
      }

      const result = await Promotion.findByIdAndDelete(delteId);
      const promotion = new Promotion(newData);
      const promotion_result = await promotion.save();
      console.log("promotion result", promotion_result);

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

   sendChatLink: async (req, res, next) => {
    const id = req.params.id;
    try {

      const client = await ClientAuth.findById(id);

      const advisor = await AdvisorAuth.findById(req.body.advisor_id);

      const promotionMinutes = {
        client: req.body.client_id,
        advisor: req.body.advisor_id,
        amount: req.body.chatAmount      
      }

      const promotions = await Promotion.find({ client: req.body.client_id , advisor: req.body.advisor_id , "amount": {$gte: 0} });

      if(promotions.length == 0) {
          console.log("Added");
          const promotion = new Promotion(promotionMinutes);
          const promotion_result = await promotion.save();
      } else {
        var amountChat = 0;
        var delteId = '';
        promotions.map((item) => {
          amountChat = amountChat + item.amount;
          delteId =  item._id;
        })

        const newData = {
          client: req.body.client_id,
          advisor: req.body.advisor_id,
          amount: parseFloat(amountChat) + parseFloat(req.body.chatAmount)      
        }

        const result = await Promotion.findByIdAndDelete(delteId);
        const promotion = new Promotion(newData);
        const promotion_result = await promotion.save();

      }

      var absoluteBasePath = path.resolve('');
      const token = jwt.sign({email: client.email, cid: client.id, aid: req.body.advisor_id, aname: advisor.username, cname: client.username }, process.env.JWT_SEC_TOKEN);
      const link = process.env.BASE_URL+'/redirect-to-chat/'+token;
      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;
      const html = await ejs.renderFile(absoluteBasePath+"/views/chat_link.ejs", { logo:logo,client: client.username, client_email: client.email, token, link});


      console.log("senchatlink",link);
      
      Nodemailer.sendChatLink(
        client.username,
        client.email,
        token,
        html
      );

      return res.send({
        success: true,
        message: 'User chat link sent sucessfully!',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  confirmCreditLink: async (req, res, next) => {

    const token = req.params.id;

    var base64Payload = token.split('.')[1];
    var payload = Buffer.from(base64Payload, 'base64');
    const decoded = JSON.parse(payload.toString());

    ClientAuth.findOne({
      email: decoded.email,
      confirmationCode: token
    })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found or Link expired." });
      }

      user.wallet_balance = parseFloat(user.wallet_balance) + parseFloat(decoded.amount);
      user.confirmationCode = '';

      user.save((err) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }else{
          res.status(200)
          .send({
            message: "Credit added successfully, please login and check your Credit. ",
          });
          return;
        }
      });
    })
    .catch((e) => console.log("error", e));
  },


  redirectToChat : async (req, res, next) => {

    const token = req.params.id;
    
    var base64Payload = token.split('.')[1];
    var payload = Buffer.from(base64Payload, 'base64');
    const decoded = JSON.parse(payload.toString());

    const auth = await AdvisorAuth.findById(decoded.aid, {rate_per_min: 1, min_chat_minutes: 1 , _id: 1});

      var min_chat_minutes = auth.min_chat_minutes ? auth.min_chat_minutes : 0;
      const global_setting = await GlobalSetting.findOne({});
      if (auth && auth.min_chat_minutes == 0) {
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
        var discontAmt = parseFloat(auth.rate_per_min - ((discount_percent*0.01)*(auth.rate_per_min))).toFixed(2);
      }

    return res.send({
        success: true,
        message: 'Data fetched',
        data: decoded,
        rate_per_min: auth.rate_per_min,
        min_chat_minutes: auth.min_chat_minutes,
        discontAmt:discontAmt,
        _id:auth._id,
        link: `${process.env.BASE_URL}/chatroom/${decoded.cid}/client/${decoded.aname}`
      });
  },

  findAdvisorById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await AdvisorAuth.findById(id, { __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0, password: 0}).populate('reviews').populate('tickets').populate('service').populate('certificate');
      
      const global_setting = await GlobalSetting.findOne({});
      
      let commission_rate = auth.commission_rate;
      let rate_per_min = auth.rate_per_min;

      var globalCommRate = 0;
      if(auth && auth.commission_rate == 0) {
        globalCommRate = global_setting.commission_rate;
      }

      let my_share = rate_per_min - (rate_per_min *(commission_rate*(1/100)));
      my_share = parseFloat(my_share).toFixed(2)
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      return res.send({
        success: true,
        message: 'Data fetched',
        data: auth,
        globalCommRate:globalCommRate,
        my_share
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  updateAdvisor: async (req, res, next) => {
    try {
      const id = req.params.id;

      const sender_id = req.user.id;

      const advisor = await AdvisorAuth.findById(id);

      const global_setting = await GlobalSetting.findOne({});
      const  min_rate_per_minute = global_setting.min_rate_per_minute||0;
      const  max_rate_per_minute = global_setting.max_rate_per_minute||100;

      // (20 <= 10 || 20 >= 18)

      if ((req.body.rate_per_min <= min_rate_per_minute) || (req.body.rate_per_min >= max_rate_per_minute)) {
        //next(createError(201, `Per min Rate is not allowed by admin ( set b/w ${min_rate_per_minute} and ${max_rate_per_minute}), please contact admin!`));
      }

      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;

      var absoluteBasePath = path.resolve('');

      if (req.body.notification && req.body.notification != advisor.notification) {

        const html = await ejs.renderFile(absoluteBasePath+"/views/admin_to_customer_notification.ejs", { logo:logo,customer: advisor.username, notice: req.body.notification});

        const checkTest = await Nodemailer.sendNotificationToCustomerByAdmin(
          advisor.username,
          advisor.email,
          html
          );  
          
        console.log("Mail Test",checkTest);  

          const notifications = {
          sender_id: sender_id,
          reciver_id: id,
          from: 'admin',
          to: 'advisor',
          notification: req.body.notification,
          type:'normal',
          advisor: id,      
          admin: sender_id,        
        }

        const notification = new Notification(notifications);
        const notification_result = await notification.save();
           
      }

      if (req.body.approved && req.body.approved == 1 && req.body.approvedEmail == 1) {

        const html = await ejs.renderFile(absoluteBasePath+"/views/advisor_approved.ejs", {logo:logo, advisor: advisor.username, advisor_email: advisor.email});

        await Nodemailer.sendApproveEmail(
          advisor.name,
          advisor.email,
          html
        );        
      }


      if ((advisor.commission_rate != req.body.commission_rate) && (req.body.commission_rate > 0)) {

        const html = await ejs.renderFile(absoluteBasePath+"/views/commission_rate.ejs", { logo:logo,advisor: advisor.username, advisor_email: advisor.email, commission_rate: req.body.commission_rate});

        await Nodemailer.sendCommissionsEmail(
          advisor.name,
          advisor.email,
          req.body.commission_rate,
          html
        );        
      }

      /*const notifications = {
        sender_id: sender_id,
        reciver_id: id,
        from: 'admin',
        to: 'advisor',
        notification: req.body.notification,
        type:'normal',
        advisor: id,      
        admin: sender_id,        
      }

      const notification = new Notification(notifications);
      const notification_result = await notification.save();*/

      /* end code for sending notification*/

      const updates = req.body;
      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated successfully!',
        data: result
      });
    } catch (error) {
      console.log(error);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Advisor Id'));
      }
      next(error);
    }
  },

  updateAdvisorCommission: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }

      const advisor = await AdvisorAuth.findById(id);
      await sendEmailCommission.sendCommissionsEmail(
        advisor.name,
        advisor.email,
        advisor.commission_rate
      );

      res.send({
        success: true,
        message: 'Advisor commission updated',
        data : advisor
      });

    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Advisor Id'));
      }
      next(error);
    }
  },

  ActivateDeactivateAdvisor: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Advisor Id'));
      }
      next(error);
    }
  },


  approveAdvisor: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Advisor Id'));
      }
      next(error);
    }
  },


  deleteAdvisor: async (req, res, next) => {
    const id = req.params.id;
    try {

      const advisor = await AdvisorAuth.findById(id,{_id:0});

      const token = jwt.sign({email: req.body.email}, process.env.JWT_SEC_TOKEN);

     /* const AuthDeleted2 = await new AuthDeleted({
        name: advisor.name,
        advisor_id: advisor._id,
        connect_on_boarding: advisor.connect_on_boarding,
        description: advisor.description,
        address: advisor.address,
        marketing_intro: advisor.marketing_intro,
        year_of_exp: advisor.year_of_exp,
        avatar: advisor.avatar,
        username: advisor.username,
        displayname: advisor.displayname,
        rate_per_min: advisor.rate_per_min,
        min_rate_per_min: advisor.min_rate_per_min,
        max_rate_per_min: advisor.max_rate_per_min,
        commission_rate: advisor.commission_rate,
        free_30_minutes: advisor.free_30_minutes,
        email: advisor.email,
        password: advisor.password,
        dob: advisor.dob,
        clients: advisor.clients,
        reviews: advisor.reviews,
        review_avg: advisor.review_avg,
        unhappy_review: advisor.unhappy_review,
        happy_review: advisor.happy_review,
        tickets: advisor.tickets,
        notes: advisor.notes,
        status: advisor.status,
        avail_free_mins: advisor.avail_free_mins,
        approved: advisor.approved,
        confirmationCode: token,
        my_mhare: advisor.my_mhare,
        user_status: advisor.user_status,
        chat_engage: advisor.chat_engage,
        chat_status: advisor.chat_status,
        addedAt: advisor.addedAt,
      }).save();*/
      
      const result = await AdvisorAuth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Advisor does not exist.');
      }
      return res.send({
        success: true,
        message: 'Data deleted!',
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

  ActivateDeactivateClient: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await ClientAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated!',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Advisor Id'));
      }
      next(error);
    }
  },

  deleteClient: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await ClientAuth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Client does not exist.');
      }
      return res.send({
        success: true,
        message: 'Data deleted!',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Client id'));
        return;
      }
      next(error);
    }
  },


  deleteUser: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await UserAuth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Client does not exist.');
      }
      return res.send({
        success: true,
        message: 'Data deleted!',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Client id'));
        return;
      }
      next(error);
    }
  },

  deleteAdmin: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Auth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Admin does not exist.');
      }
      return res.send({
        success: true,
        message: 'Data deleted!',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Admin id'));
        return;
      }
      next(error);
    }
  },

  updateClient: async (req, res, next) => {
    try {
      const id = req.params.id;

      const sender_id = req.user.id;

      const client = await ClientAuth.findById(id);

      var absoluteBasePath = path.resolve('');

      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;

      if (req.body.notification && req.body.notification != client.notification) {

        const html = await ejs.renderFile(absoluteBasePath+"/views/admin_to_customer_notification.ejs", { logo:logo,customer: client.username, notice: req.body.notification});

        await Nodemailer.sendNotificationToCustomerByAdmin(
          client.username,
          client.email,
          html
          );      

        const notifications = {
          sender_id: sender_id,
          reciver_id: id,
          from: 'admin',
          to: 'client',
          notification: req.body.notification,
          type:'normal',
          client: id,      
          admin: sender_id,        
        }

        const notification = new Notification(notifications);
        const notification_result = await notification.save();

      }

      /* end code for sending notification*/

      const updates = req.body;
      const options = { new: true };

      const result = await ClientAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Client does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Client Id'));
      }
      next(error);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const id = req.params.id;
      
      const updates = req.body;
      const options = { new: true };

      const result = await UserAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Client does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Client Id'));
      }
      next(error);
    }
  },

  updateAdmin: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Admin does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Admin Id'));
      }
      next(error);
    }
  },

  getClients: asyncHandler(async (req, res, next) => {
    
    ClientAuth.find({},{ __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0, tickets: 0, password: 0, notification: 0, reviews: 0, services: 0},
      function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data};
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),

  getAdvisors: asyncHandler(async (req, res, next) => {

    AdvisorAuth.find({},{ __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0, tickets: 0, password: 0, notification: 0, reviews: 0, services: 0},
      function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data};
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),

  getAdvisorsList: asyncHandler(async (req, res, next) => {

    AdvisorAuth.find({status: 1, approved: 1},{ username: 1},
      function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data};
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),

  /*await mailer.sendMail(to, subject, body)*/
};