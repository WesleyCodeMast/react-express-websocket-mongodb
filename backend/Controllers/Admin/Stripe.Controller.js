const mongoose = require('mongoose');

var bcrypt = require("bcrypt");

const asyncHandler = require('../../Middleware/asyncHandler')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);


module.exports = {

  transactions: asyncHandler(async (req, res, next) => {

    const transactions = await stripe.balanceTransactions.list({
      limit: 20,
    });
    if(!transactions) {
      response = {"error": true, "message": "Error fetching data"+err};
    } else {
      response = {"success": true, "message": 'data fetched', 'data': transactions};
    }
    res.json(response);
  }),

  payouts: asyncHandler(async (req, res, next) => {

    const payouts = await stripe.payouts.list({
      limit: 20,
    });
    if(!payouts) {
      response = {"error": true, "message": "Error fetching data"+err};
    } else {
      response = {"success": true, "message": 'data fetched', 'data': payouts};
    }
    res.json(response);
  }),

  paymentIntents: asyncHandler(async (req, res, next) => {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 20,
    });
    if(!paymentIntents) {
      response = {"error": true, "message": "Error fetching data"+err};
    } else {
      response = {"success": true, "message": 'data fetched', 'data': paymentIntents};
    }
    res.json(response);
  })


}