const createError = require('http-errors');
const mongoose = require('mongoose');
const moment  = require('moment');

const asyncHandler = require('../../Middleware/asyncHandler');
const { exists } = require('../../Models/Advisor/Auth.model');

const AdvisorAuth = require('../../Models/Advisor/Auth.model');
const AdvisorReview = require('../../Models/Advisor/Review.model');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {

  getAllAdvisors: asyncHandler(async (req, res, next) => {

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

    var  totalPosts = await AdvisorAuth.find({...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name}).countDocuments().exec();

    AdvisorAuth.find({...filter_created_at, ...filter_status, ...filter_email, ...filter_mobile, ...filter_name},{ __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0},
      query,function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data, 'page': page, 'total': totalPosts, perPage:size };
        }
        res.json(response);
      }).sort({ $natural: -1 });
  }),

  findAdvisorById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await AdvisorAuth.findById(id, { __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0});
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

  deleteAdvisor: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await AdvisorAuth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Advisor does not exist.');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Advisor id'));
        return;
      }
      next(error);
    }
  },

  updateAdvisor: async (req, res, next) => {
    try {
      const id = req.params.id;

      const updates = req.body;
      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Advisor Id'));
      }
      next(error);
    }
  },

  stripeConnect: async (req, res, next) => {
    try {

      if (req.user.stripe_account_link) {

        const accountDetail = await stripe.accounts.retrieve(
          req.user.stripe_customer_id
          );

        if (accountDetail.details_submitted || accountDetail.charges_enabled) {
          return res.send({
            success: true,
            message: 'stripe account created successfully!',
            data: accountDetail,
            onboarding: true
          });
        }
      }

      new_account = await stripe.accounts.create({
        type: 'custom',
        email: req.user.email,
        metadata : {
          description: 'Advisor stripe account creating',
          name: req.user.name,
          phone: req.user.mobile,
          balance: 0.0,
        },
        country: req.user.country,
        business_type: 'individual',
        capabilities: {
          card_payments: {requested: true},
          transfers: {requested: true},
        },
        tos_acceptance: {
          date: moment().unix(), ip:req.ip
        }
      })

      const account_links = await stripe.accountLinks.create({
        account: new_account.id,
        refresh_url: `${process.env.BASE_URL}/advisor/dashboard`,
        return_url: `${process.env.BASE_URL}/advisor/stripe/success/${new_account.id}`,
        type: 'account_update',
      });

      req.body.stripe_customer_id = new_account.id;
      req.body.stripe_account_link = account_links.url;

      const updates = req.body;
      const options = { new: true };

      const id = req.user.id;

      const result = await AdvisorAuth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }

      return res.send({
        success: true,
        message: 'stripe account link created successfully!',
        data: account_links.url,
        onboarding: false,
      });
    } catch (error) {
        console.log(error.message);
        if (error instanceof mongoose.CastError) {
          return next(createError(201, 'Invalid Advisor Id'));
        }
        next(error);
      }
    },

  saveStripeConnect: asyncHandler(async (req, res, next) => {

   /*{
    "accountDetail": {
        "id": "acct_1MGiIDAV9RWLY77O",
        "object": "account",
        "business_profile": {
            "mcc": "5734",
            "name": null,
            "product_description": null,
            "support_address": null,
            "support_email": null,
            "support_phone": null,
            "support_url": null,
            "url": "testwebsite.com"
        },
        "business_type": "individual",
        "capabilities": {
            "card_payments": "active",
            "platform_payments": "active"
        },
        "charges_enabled": true,
        "company": {
            "address": {
                "city": "North Providence",
                "country": "US",
                "line1": "Testa Drive",
                "line2": null,
                "postal_code": "02911",
                "state": "RI"
            },
            "directors_provided": true,
            "executives_provided": true,
            "name": null,
            "owners_provided": true,
            "phone": "+19026574061",
            "tax_id_provided": false,
            "verification": {
                "document": {
                    "back": null,
                    "details": null,
                    "details_code": null,
                    "front": null
                }
            }
        },
        "country": "US",
        "created": 1671452290,
        "default_currency": "usd",
        "details_submitted": false,
        "email": "er.krishna.mishra@gmail.com",
        "external_accounts": {
            "object": "list",
            "data": [],
            "has_more": false,
            "total_count": 0,
            "url": "/v1/accounts/acct_1MGiIDAV9RWLY77O/external_accounts"
        },
        "future_requirements": {
            "alternatives": [],
            "current_deadline": null,
            "currently_due": [],
            "disabled_reason": null,
            "errors": [],
            "eventually_due": [],
            "past_due": [],
            "pending_verification": []
        },
        "individual": {
            "id": "person_1MGiK2AV9RWLY77OvMJcsRIP",
            "object": "person",
            "account": "acct_1MGiIDAV9RWLY77O",
            "address": {
                "city": "North Providence",
                "country": "US",
                "line1": "Testa Drive",
                "line2": null,
                "postal_code": "02911",
                "state": "RI"
            },
            "created": 1671452399,
            "dob": {
                "day": 8,
                "month": 7,
                "year": 1994
            },
            "email": "er.krishna.mishra@gmail.com",
            "first_name": "Krishna",
            "future_requirements": {
                "alternatives": [],
                "currently_due": [],
                "errors": [],
                "eventually_due": [],
                "past_due": [],
                "pending_verification": []
            },
            "id_number_provided": true,
            "last_name": "Mishra",
            "metadata": {},
            "phone": "+19026574061",
            "relationship": {
                "account_opener": true,
                "director": false,
                "executive": false,
                "owner": false,
                "percent_ownership": null,
                "representative": true,
                "title": null
            },
            "requirements": {
                "alternatives": [],
                "currently_due": [
                    "address.line1"
                ],
                "errors": [
                    {
                        "code": "invalid_street_address",
                        "reason": "The provided street address cannot be found. Please verify the street name and number are correct in \"Testa Drive\"",
                        "requirement": "address.line1"
                    }
                ],
                "eventually_due": [
                    "address.line1"
                ],
                "past_due": [],
                "pending_verification": []
            },
            "ssn_last_4_provided": true,
            "verification": {
                "additional_document": {
                    "back": null,
                    "details": null,
                    "details_code": null,
                    "front": null
                },
                "details": null,
                "details_code": null,
                "document": {
                    "back": null,
                    "details": null,
                    "details_code": null,
                    "front": "file_1MGiPxGYmfBHZbWKMmgQfCT5"
                },
                "status": "verified"
            }
        },
        "metadata": {
            "balance": "0",
            "description": "Advisor stripe account creating",
            "name": "Krishna Mishra Advisor",
            "phone": "9026574061"
        },
        "payouts_enabled": false,
        "requirements": {
            "alternatives": [],
            "current_deadline": 1674044784,
            "currently_due": [
                "external_account",
                "individual.address.line1"
            ],
            "disabled_reason": "requirements.past_due",
            "errors": [
                {
                    "code": "invalid_street_address",
                    "reason": "The provided street address cannot be found. Please verify the street name and number are correct in \"Testa Drive\"",
                    "requirement": "individual.address.line1"
                }
            ],
            "eventually_due": [
                "external_account",
                "individual.address.line1"
            ],
            "past_due": [
                "external_account"
            ],
            "pending_verification": []
        },
        "settings": {
            "bacs_debit_payments": {},
            "branding": {
                "icon": null,
                "logo": null,
                "primary_color": null,
                "secondary_color": null
            },
            "card_issuing": {
                "tos_acceptance": {
                    "date": null,
                    "ip": null
                }
            },
            "card_payments": {
                "decline_on": {
                    "avs_failure": false,
                    "cvc_failure": false
                },
                "statement_descriptor_prefix": null,
                "statement_descriptor_prefix_kana": null,
                "statement_descriptor_prefix_kanji": null
            },
            "dashboard": {
                "display_name": "Testwebsite",
                "timezone": "Etc/UTC"
            },
            "payments": {
                "statement_descriptor": "TESTWEBSITE.COM",
                "statement_descriptor_kana": null,
                "statement_descriptor_kanji": null
            },
            "payouts": {
                "debit_negative_balances": false,
                "schedule": {
                    "delay_days": 2,
                    "interval": "daily"
                },
                "statement_descriptor": null
            },
            "sepa_debit_payments": {}
        },
        "tos_acceptance": {
            "date": 1671452973,
            "ip": "106.208.152.24",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
        },
        "type": "custom"
    }
}*/

    const advisor = await AdvisorAuth.findOne({stripe_customer_id: req.body.stripe_customer_id});  

      const updates = {
        connect_on_boarding: 1
      };

      const options = { new: true };

      const result = await AdvisorAuth.findByIdAndUpdate(advisor.id, updates, options);
      if (!result) {
        throw createError(201, 'Advisor does not exist');
      }

      return res.send({
        success :true,
        message: 'stripe account updated successfully!',
      });

  }),

  getAllReviews: asyncHandler(async (req, res, next) => {

    AdvisorAuth.findById(req.user._id,{ __v: 0, updatedAt: 0, tokens: 0, confirmationCode: 0},
      function(err,data) {
        if(err) {
          response = {"error": true, "message": "Error fetching data"+err};
        } else {
          response = {"success": true, "message": 'data fetched', 'data': data };
        }
        res.json(response);
      }).populate({path :'reviews', select: 'client_name review rating createdAt addedAt', options: { sort: { $natural: -1 } } });
  }),

};