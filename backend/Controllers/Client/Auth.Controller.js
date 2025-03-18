const createError = require('http-errors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcrypt");
const path = require('path')
const ejs = require('ejs');
const axios = require('axios');
const Auth = require('../../Models/Client/Auth.model');
const Payment = require('../../Models/Payment.model');
const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const ClientMessage = require('../../Models/Message.model');
const GlobalSetting = require('../../Models/GlobalSetting.model');
const FreeMinute = require('../../Models/FreeMinute.model');
const Nodemailer = require('../../Utils/Nodemailer')
const Validator = require('validatorjs');
const Promotion = require('../../Models/Promotion.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var request = require('superagent');

var MailChimp = require('mailchimp').MailChimpAPI;
var apiKey = process.env.MAILCHIMPAPIKEY;
global.MailChimpAPI = new MailChimp(apiKey, {
    version: '2.0'
});

/* function to create stripe customer*/
async function createStripeCustomer({ name, email, phone }) {
  return new Promise(async (resolve, reject) => {
    try {
      const Customer = await stripe.customers.create({
        name: name,
        email: email,
        phone: phone,
      });

      resolve(Customer);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

function attachMethod({ card, billingDetails, customerId }) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        billing_details: billingDetails,
        card,
      });
      const paymentMethodAttach = await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });
      resolve(paymentMethodAttach);
    } catch (err) {
      reject(err);
    }
  });
}

/* Util to list the payment methods */
async function listCustomerPayMethods(customerId) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentMethods = await stripe.customers.listPaymentMethods(customerId, {
        type: "card",
      });
      resolve(paymentMethods);
    } catch (err) {
      reject(err);
    }
  });
}

async function checkNameIsUnique(name) {

  totalPosts = await Auth.countDocuments({ username: name });
  if (totalPosts > 0) {
    return true;
  } else {
    return false;
  }
};

async function checkEmailIsUnique(email) {

  totalPosts = await Auth.countDocuments({ email: email });
  if (totalPosts > 0) {
    return true;
  } else {
    totalPosts = await AdvisorAuth.countDocuments({ email: email });
    if (totalPosts > 0) {
      return true;
    }else{
      return false;
    }
  }
};

module.exports = {
  getAllAuths: async (req, res, next) => {
    try {
      const results = await Auth.find({}, { __v: 0 });
      res.send(results);
    } catch (error) {
      console.log(error.message);
    }
  },

  getAllAdmins: async (req, res, next) => {
    try {
      const results = await Auth.find({}, { __v: 0 });
      res.send(results);
    } catch (error) {
      console.log(error.message);
    }
  },


  verifyToken: async (req, res, next) => {
      try{
      let token = req.body;
      let response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.APP_SECRET_KEY}&response=${token}`);
      return res.status(200).json({
        success:true,
        message: "Token successfully verified",
        data: response.data
      });
    }catch(error){
      console.log(error);
      return res.status(500).json({
        success:false,
        message: "Error verifying token"
      })
    }
  },

  verifyAToken: async (req, res, next) => {
    try {
      const results = await Auth.find({}, { __v: 0 });
      // const results = await Auth.find({}, { name: 1, price: 1, _id: 0 });
      // const results = await Auth.find({ price: 699 }, {});
      res.send(results);
    } catch (error) {
      console.log(error.message);
    }
  },

  adminLogout: async (req, res, next) => {
    try {
      req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token
      })
      await req.user.save()
      res.send('user Logout')
    } catch (error) {
      res.status(500).send(error)
    }
  },

  adminRegister: async (req, res, next) => {
    console.log("this is client register");
    try {
      let rules = {
      username: 'required',
      email: 'required',
      password: 'required',
      password_confirmation: 'required',
    };

    const validation = new Validator(req.body, rules);
    console.log("this is client register");
    if (validation.fails()) {
      return res.status(412).send({
        success: false,
        message: 'Validation failed',
        data: validation.errors
      });
    }

      if (req.body.password !== req.body.password_confirmation) {
       return res.status(412)
        .send({
          success: false,
          error: true,
          message: 'Password and Confirm Password does not match!',
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

      const token = jwt.sign({email: req.body.email}, process.env.JWT_SEC_TOKEN);

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      const user = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        account_created_by: req.body.account_created_by,
        addedAt: today,
        password: bcrypt.hashSync(req.body.password, 8),
        confirmationCode: token
      };

      const freeminute = await FreeMinute.findOne({email:req.body.email}).sort({$natural: -1});
      var free_minute = (freeminute) ? freeminute.minutes : 0;

      const customerName = req.body.name;
      const customerEmail = req.body.email;
      const customerMobile = req.body.mobile;

      //const customer = await createStripeCustomer({ customerName, customerEmail, customerMobile });

      const user1 = new Auth({
        //stripe_customer_id : customer.id,
        name: req.body.name,
        email: req.body.email,
        status: 1,
        account_created_by: req.body.account_created_by,
        wallet_balance: free_minute,
        addedAt: today,
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 8),
        status: 0,
        confirmationCode: token
      });

      const logoData = await GlobalSetting.findOne({});
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;


      var absoluteBasePath = path.resolve('');
      const link = process.env.BASE_URL+'/confirm-client/'+token;
      const html = await ejs.renderFile(absoluteBasePath+"/views/confirmation_link.ejs", { logo:logo,client: user.username, client_email: user.email, token, link});

      await FreeMinute.deleteMany({email:req.body.email});
      
      user1.save((err, user) => {
        if (err) {
          res.status(500)
            .send({
              message: err
            });
          return;
        } else {

          /*Nodemailer.sendConfirmationEmail(
              user.username,
              user.email,
              user.confirmationCode,
              html
            );*/

          /*mail chimp code*/

          var fullName = req.body.username.split(' '),
          firstName = fullName[0],
          lastName = fullName[fullName.length - 1];

          var userData = {
            "id": process.env.LISTUNIQUEID,   
            "email": {
              "email": req.body.email,   
            },
            "merge_vars": {
              FNAME: firstName,
              LNAME: lastName  
            }

          }
          MailChimpAPI.call('lists', 'subscribe', userData, function(error, data) {
            if (error) {
            }else {
              // console.log('2',data);
            }
          });

          /*mail chimp code*/

          res.status(200)
            .send({
              message: "User was registered successfully!",
            });
        }
      });
      /*const auth = new Auth(user);
      const result = await auth.save();
      res.send(result);*/

    } catch (error) {
      console.log(error);
      if (error.name === 'ValidationError') {
        next(createError(201, error.message));
        return;
      }
      next(error);
    }
  },

  AddWalletBalance: async (req, res, next) => {
    try {
      const id = req.user._id;

      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, {wallet_balance : req.body.wallet_balance}, options);
      req.body.status = 1;
      req.body.client = id;

      const wallet_transaction = new walletTransaction(req.body);
      const walletTransactionResult = await wallet_transaction.save();

      if (!result) {
        throw createError(201, 'Auth does not exist');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  confirmEmail: async (req, res, next) => {
    Auth.findOne({
      confirmationCode: req.params.confirmationCode,
    })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      user.status = 1;
      user.save((err) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }else{
          res.status(200)
          .send({
            message: "Client was Verified successfully! Please Login",
          });
          return;
        }
      });
    })
    .catch((e) => console.log("error", e));
  },

  adminLogin: async (req, res, next) => {

    const { email, password } = req.body;

    const user = await Auth.countDocuments({ email: email });

    if (user) {

      const user = await Auth.findOne({ email: email });

      /*if (!user.status) {
        return res.status(401).send({
          message: "Pending Account. Please Verify Your Email!",
        });
      }*/

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(201)
          .send({
            accessToken: null,
            message: "Invalid Password!"
          });
      }

      var token = jwt.sign({
        id: user.id,
        name: user.name,
        username: user.username,
      }, process.env.JWT_SEC_CLIENT, {
        expiresIn: '10h'
      });

      user.tokens = user.tokens.concat({ token })
      await user.save();

      res.status(200)
        .send({
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            name: user.name,
          },
          message: "Login successfull",
          accessToken: token,
        });

    } else {
      next(createError(201, 'Username or password incorrect'));
    }

  },


  googleRegisterLogin: async (req, res, next) => {

    const { email, name } = req.body;

    const user = await Auth.countDocuments({ email: email });

    if (user) {

      const user = await Auth.findOne({ email: email });

      var token = jwt.sign({
        id: user.id,
        username: user.username,
      }, process.env.JWT_SEC_CLIENT, {
        expiresIn: '10h'
      });

      user.tokens = user.tokens.concat({ token })
      await user.save();

      res.status(200)
      .send({
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          name: user.name,
        },
        message: "Login successfull",
        accessToken: token,
      });

    } else {
      const tokenData = jwt.sign({email: req.body.email}, process.env.JWT_SEC_TOKEN);
      const user = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.name,
        displayname: req.body.name,
        rate_per_min: req.body.rate_per_min,
        dob: req.body.dob,
        account_created_by: req.body.account_created_by,
        confirmationCode: tokenData,
        password: bcrypt.hashSync(req.body.password, 8)
      };

      const auth = new Auth(user);
      const UserResult = await auth.save();

      var token = jwt.sign({
        id: UserResult.id,
        username: UserResult.username,
      }, process.env.JWT_SEC_CLIENT, {
        expiresIn: '10h'
      });

      UserResult.tokens = UserResult.tokens.concat({ token });

      await UserResult.save();

      res.status(200)
      .send({
        UserResult: {
          id: UserResult._id,
          email: UserResult.email,
          userame: UserResult.username,
          name: UserResult.name,
          account_created_by: UserResult.account_created_by
        },
        message: "Login successfull",
        accessToken: token,
      });
    }

  },

  findAuthById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await Auth.findById(id);
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send(auth);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },


  resetPassword: async (req, res, next) => {

    if (req.body.password !== req.body.password_confirmation) {

      next(createError(201, "Pass and Confirm Password does not match!"));
      return;
    }

    var passwordIsValid = bcrypt.compareSync(
      req.body.current_password,
      req.user.password
    );

    if(req.body.accountCreatedBy != 'google') {
      if (!passwordIsValid) {
        next(createError(201, "Invalid or expired current password"));
        return;
      }
    } 

    if(req.body.accountCreatedBy == 'google') {
      await Auth.updateOne(
        { _id: req.user._id.toString() },
        { $set: { account_created_by: 'google-old' } },
        { new: true }
      );
    }
    

    await Auth.updateOne(
      { _id: req.user._id.toString() },
      { $set: { password: bcrypt.hashSync(req.body.password, 8) } },
      { new: true }
    );

    const user = await Auth.findById({ _id: req.user._id.toString() });

    res.send({
      success: true,
      message: 'Password changed successfully!',
    });

  },

  profile: async (req, res, next) => {
    try {
      const auth = await Auth.findOne({ _id: req.user._id }, { __v: 0, tokens: 0 });

      const message_count = await ClientMessage.countDocuments({client:req.user.id});
      var totalClients =  await Auth.findById(req.user.id,{advisors: 1}).populate({ path: 'advisors'});
      // var totalReviews =  await Auth.findById(req.user.id,{reviews: 1}).populate({ path: 'reviews'});

      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send({
        success: true,
        message: 'user fetched!',
        data: auth,
        inbox_count: message_count,
        advisors_count: totalClients.advisors.length,
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

  newprofile: async (req, res, next) => {
    try {
      const auth = await Auth.findOne({ _id: req.user._id }, { __v: 0, tokens: 0 });

      const message_count = await ClientMessage.countDocuments({client:req.user.id});
      var totalClients =  await Auth.findById(req.user.id,{advisors: 1}).populate({ path: 'advisors'});
      // var totalReviews =  await Auth.findById(req.user.id,{reviews: 1}).populate({ path: 'reviews'});

      const promotion = await Promotion.find({ client: req.user.id , advisor: req.params.id });

      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send({
        success: true,
        message: 'user fetched!',
        data: auth,
        promotion: promotion,
        inbox_count: message_count,
        advisors_count: totalClients.advisors.length,
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

  updateAAuth: async (req, res, next) => {
    try {
      const id = req.user._id;

      if (req.file) {
        req.body.avatar = req.file.path;
      }

      const updates = req.body;
      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

   updateWalletBalance: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, {wallet_balance : (parseFloat(req.body.wallet_balance))}, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }
      return res.send({
        success: true,
        message: 'Wallet Balance updated successfully!',
        data: result.wallet_balance
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  deleteAAuth: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Auth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },


  paymentMethodAttach: async (req, res) => {

    const { paymentMethod } = req.body;

    const { cardNumber, expMonth, expYear, name, address } = req.body;
    const card = {
      number: cardNumber,
      exp_month: parseInt(expMonth),
      exp_year: parseInt(expYear),
    };


    const billingDetails = {
      name: name,
      address: {
        country: address.country,
        state: address.state,
        city: address.city,
        line1: address.line1,
        postal_code: address.postal_code,
      },
    };

    const customerId = req.user.stripe_customer_id;

    try {
      const method = await attachMethod({ card, billingDetails, customerId });
      res.status(200).json({ message: "Payment method attached succesully" });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "Could not attach method" });
    }
  },

  paymentMethods : async (req, res) => {

    const customerId = req.user.stripe_customer_id;

    try {
      const paymentMethods = await listCustomerPayMethods(customerId);
      res.status(200).json(paymentMethods);
    } catch (err) {
      console.log(err);
      res.status(500).json("Could not get payment methods");
    }
  },

  paymentCreate : async (req, res) => {
    const amount = req.body.amount;
    const userCustomerId = req.user.stripe_customer_id;
    const metadata = {
      'client_name' : req.user.name,
      'client_id' : req.user.id,
      'client_email' : req.user.email,
      'type' : 'addminutes',
    };
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: (process.env.STRIPE_CURRENCY),
        customer: userCustomerId,
        setup_future_usage: 'off_session',
        confirmation_method: "automatic",
        description: "Wallet Top Up",
        metadata : metadata
      });

      res.status(200).json(paymentIntent);
    } catch (err) {
      console.log(err);
      res.status(500).json("Could not create payment");
    }
  },


  paymentCreateChat : async (req, res) => {
    const advisor_id = req.body.advisor_id;

    const advisor = await AdvisorAuth.findById(advisor_id);

    const amount = req.body.amount;
    const currency = process.STRIPE_CURRENCY;
    const userCustomerId = req.user.stripe_customer_id;

    if ((advisor.commission_rate) && (advisor.commission_rate > 0)) {
      var app_fee = parseFloat(advisor.commission_rate) * 0.01 * amount;
    } else {
      const setting = await GlobalSetting.findOne();

      if(setting) {
        var app_fee = parseFloat(setting.commission_rate) * 0.01 * amount;
      } else {
        var app_fee = parseFloat(1) * 0.01 * amount;
      }
    }

   
    try {         

      /*const talAmot = (parseFloat(amount)-parseFloat(app_fee));   

      const payment_intent = await stripe.paymentIntents.create({
        payment_method_types : ['card'],
        amount : amount,
        description : 'customer payed for chating to advisor',
        customer : userCustomerId,
        currency : (process.env.STRIPE_CURRENCY),
        application_fee_amount : parseInt(app_fee),
        metadata: {
          client_name: req.user.name,
          client_id: req.user.id,
          client_email: req.user.email,
          type: 'chat',
          advisor_name: advisor.name,
          advisor_id: advisor.id,
          advisor_email: advisor.email,
        },
        transfer_group : advisor.id,
        transfer_data : {
          destination : 'acct_1M8zWKSIqsdzZyif',
        },
      });

      return res.status(200).json(payment_intent);*/

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount*100,
        currency: (process.env.STRIPE_CURRENCY),
        customer: userCustomerId,
        // setup_future_usage: 'off_session',
        confirmation_method: "automatic",
        // application_fee_amount: parseInt(app_fee),
        description: "Wallet Top Up",
        /*shipping: {
          name: req.user.name,
          address: {
            line1: '510 Townsend St',
            postal_code: '98140',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
          },
        },*/
        metadata: {
          client_name: req.user.name,
          client_id: req.user.id,
          client_email: req.user.email,
          type: 'chat',
          advisor_name: advisor.name,
          advisor_id: advisor.id,
          advisor_email: advisor.email,
        },
        /*transfer_data: {
          // destination: 'acct_1M8zWKSIqsdzZyif',
          destination: advisor.stripe_customer_id,
        },*/
      });

      res.status(200).json(paymentIntent);
    } catch (err) {
      console.log(err);
      res.status(500).json("Could not create payment");
    }
  },

  paymentConfirm : async (req, res) => {
    const { payment_intent, payment_method } = req.body;
    try {
      const intent = await stripe.paymentIntents.confirm(payment_intent, {
        payment_method: payment_method,
      });

      payment = {
        client: req.user.id,
        name: req.user.name,
        email: req.user.email,
        client_stripe_id: req.user.stripe_customer_id,
        advisor_stripe_id: req.user.stripe_customer_id,
        amount: intent.amount,
        app_fee: intent.application_fee_amount,
        payment_intent: intent.id,
        payment_type: 'addbalance',
        transaction_id: intent.id,
        status: intent.status,
      };

      const payment = new Payment(payment);
      const result = await payment.save();

      res.status(200).json(intent);
    } catch (err) {
      console.error(err);
      res.status(500).json("Could not confirm payment");
    }
  },

  paymentSave : async (req, res) => {
    const { payment_intent } = req.body;
    try {

      const amount = payment_intent.amount;

      const setting = await GlobalSetting.findOne();

      if(setting) {
        var app_fee = parseFloat(setting.commission_rate) * 0.01 * (amount/100);
      } else {
        var app_fee = parseFloat(1) * 0.01 * (amount/100);
      }

      const paymentDtaa = {
        client: req.user.id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        client_stripe_id: req.user.stripe_customer_id,
        // advisor_stripe_id: req.user.stripe_customer_id,
        //advisor: req.body.advisor_id,
        amount: amount/100,
        app_fee: app_fee,
        payment_intent: payment_intent.id,
        payment_type: 'addbalance',
        transaction_id: payment_intent.id,
        status: payment_intent.status,
      };
      

      const blance = payment_intent.amount/100;

      const clientData = await Auth.findOne({ _id: req.user._id});


      var ballence = 0;
      if (clientData && clientData.wallet_balance) {
        ballence = clientData.wallet_balance;
      }

      const client = await Auth.updateOne(
        { _id: req.user._id},
        {$set: {wallet_balance: ballence+blance}},
        {upsert: true}
        );

      const payment = new Payment(paymentDtaa);
      const result = await payment.save();

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  },

  sendEmailMailchimpOld : async (req, res) => {

    var userData = {
      "id": process.env.LISTUNIQUEID,   
      "email": {
        "email": req.body.email,   
      },
      "merge_vars": {
        FNAME: req.body.firstName,
        LNAME: req.body.lastName  
      }

    }
    MailChimpAPI.call('lists',  'subscribe', userData, function(error, data) {
      if (error) {
        return res.status(200).json({
          success : true,
          message : 'User subscription error occured!',
          data : error.message
        });
      }else {
        /*var subscribeUser = function(userInfo) {
          MailChimpAPI.call('campaigns', 'list', { start: 0, limit: 30 }, function (error, data) {
            if (error){
              return res.status(200).json({
                success : true,
                message : 'User subscription error occured!',
                data : error.message
              });
            } else{
              return res.status(200).json({
                success : true,
                message : 'User subscribed succesully!',
                data: JSON.stringify(data)
              });
            }
          });
        }*/

        return res.status(200).json({
          success : true,
          message : 'User subscribed succesully!',
          data: data
        });
      }
    });

  },

  sendEmailMailchimp : async (req, res) => {

    var mailchimpInstance   = process.env.MAILCHIMPINSTANCE || 'us6',
    listUniqueId        = process.env.LISTUNIQUEID,
    mailchimpApiKey     = process.env.MAILCHIMPAPIKEY;


    const { email } = req.body;
    try {
      await request
      .post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + listUniqueId + '/members/')
      .set('Content-Type', 'application/json;charset=utf-8')
      .set('Authorization', 'Basic ' + new Buffer('any:' + mailchimpApiKey ).toString('base64'))
      .send({
        'email_address': req.body.email,
        'status': 'subscribed',
        'merge_fields': {
          'FNAME': req.body.firstName,
          'LNAME': req.body.lastName
        }
      })
      .end(function(err, response) {
        if (response.status < 300 || (response.status === 400 && response.body.title === "Member Exists")) {
          return res.status(200).json({
            success : true,
            message : 'User subscribed succesully!'
          });
        } else {
          return res.status(200).json({
            success : true,
            message : 'User subscription error occured!'
          });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  },

  paymentSaveChat : async (req, res) => {
    const { payment_intent , minutes } = req.body;
    
    try {

      // const amount = payment_intent.amount;

      // const advisor_id = req.body.advisor_id;

      // const advisor = await AdvisorAuth.findById(advisor_id);

      // const setting = await GlobalSetting.findOne();

      // if ((advisor.commission_rate) && (advisor.commission_rate > 0)) {
      //   var app_fee = parseFloat(advisor.commission_rate) * 0.01 * (amount/100);
      // }else{

      //   if(setting) {
      //     var app_fee = parseFloat(setting.commission_rate) * 0.01 * (amount/100);
      //   } else {
      //     var app_fee = parseFloat(1) * 0.01 * (amount/100);
      //   }
      // }

      // const paymentDtaa = {
      //   client: req.user.id,
      //   name: req.user.name,
      //   username: req.user.username,
      //   email: req.user.email,
      //   advisor_name: advisor.name,
      //   advisor_username: advisor.username,
      //   advisor_email: advisor.email,
      //   client_stripe_id: req.user.stripe_customer_id,
      //   advisor_stripe_id: (advisor && advisor.stripe_customer_id ) ? advisor.stripe_customer_id : '',
      //   advisor: req.body.advisor_id,
      //   amount: amount/100,
      //   app_fee: app_fee,
      //   payment_intent: payment_intent.id,
      //   payment_type: 'chat',
      //   transaction_id: payment_intent.id,
      //   status: payment_intent.status,
      // };

      var blance = (payment_intent.amount)/100;

      // const clientData = await Auth.findById(req.user.id); 

      // var ballence = 0;
      // if (clientData && clientData.wallet_balance) {
      //   ballence = clientData.wallet_balance;
      // }
      var ballence = 20;
      ballence = Math.round((ballence) * 100) / 100;
      blance = Math.round((blance) * 100) / 100;

      const client = await Auth.updateOne(
        { _id: (req.user.id ?? req.body.client_id)},
        {$set: {wallet_balance: ballence+blance}},
        {upsert: true}
        );

      // const payment = new Payment(paymentDtaa);
      // const result = await payment.save();
      
      res.status(200).json({
        'result' : 'result',
        'client' : client
      });
    } catch (err) {
      console.error(err);
      res.status(500).json("Could not confirm payment");
    }
  }

};