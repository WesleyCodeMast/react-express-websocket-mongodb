const config = require('../../config/stripe');
const stripe = require('stripe')('sk_test_RumEtS503VIgh5EqyxTx2VxX00Ru2xErBY');
const httpBuildQuery = require('http-build-query');


const createaCustomer = async (req, res) => {

	new_account = await stripe.accounts.create({
		type: 'custom',
		email: 'jenny.rosen@example.com',
		name: 'Anna Stein',
		description: 'test',
		balance: 5000.0,
		country: 'US',
		capabilities: {
			card_payments: {requested: true},
			transfers: {requested: true},
		},
	})

	account_links = await stripe.accountLinks.create({
		account: new_account.id,
		refresh_url: 'http://localhost:3000/reauth',
		return_url: 'http://localhost:3000/return',
		type: 'account_onboarding',
	});

	const setupIntent = await stripe.setupIntents.create({
		customer:  stripeCustomerId
	});
	clientSecret = setupIntent.client_secret;

	const paymentMethod = await stripe.paymentMethods.create({
		type: 'card',
		card: {
			number: '4242424242424242',
			exp_month: 11,
			exp_year: 2023,
			cvc: '314',
		},
	});


	const paymentIntents = await stripe.paymentIntents.create({
		payment_method: paymentMethod.id,
		amount: 500,
		currency: 'inr',
		confirm: true,
		application_fee_amount: 2,
		payment_method_types: ['card'],
		transfer_data: {
			destination: 'acct_1M8zWKSIqsdzZyif'
		}
	});


	res.json({
		new_account,
		account_links,
		clientSecret,
		paymentIntents
	});

}

const connectStripePayment = async (req, res) => {

const stripe = require('stripe')('sk_test_RumEtS503VIgh5EqyxTx2VxX00Ru2xErBY');

/*new_account = await stripe.accounts.create({
  type: 'custom',
  email: 'jenny.rosen@example.com',
  country: 'US',
  capabilities: {
    card_payments: {requested: true},
    transfers: {requested: true},
  },
})

account_links = await stripe.accountLinks.create({
  account: new_account.id,
  refresh_url: 'http://localhost:3000/reauth',
  return_url: 'http://localhost:3000/return',
  type: 'account_onboarding',
})

return res.json({
	new_account,
	account_links

})*/

// const account = await stripe.accounts.create({type: 'express'});

/*const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: 'krishnamishra@gmail.com',
  capabilities: {card_payments: {requested: true}, transfers: {requested: true}},
});

return res.json({
	account
})*/



/*const accountU = await stripe.accounts.update(
  'acct_1M7zZmBWaGfQBam3',
  {
    capabilities: {
      bancontact_payments: {requested: true},
      eps_payments: {requested: true},
      giropay_payments: {requested: true},
      ideal_payments: {requested: true},
      p24_payments: {requested: true},
      sofort_payments: {requested: true},
      sepa_debit_payments: {requested: true},
    },
  }
);

return res.json({
	accountU
})*/



// const stripe = require('stripe')('sk_test_GanMDeNcvaMCxQyFvpSHoDT500opadHpnd');

/*const accountLink = await stripe.accountLinks.create({
  account: 'acct_1M7ylQSBx5G0urdO',
  refresh_url: 'https://example.com/reauth',
  return_url: 'https://example.com/return',
  type: 'account_onboarding',
});

return res.json({
	accountLink
})*/

	// const stripe = require('stripe')('sk_test_RumEtS503VIgh5EqyxTx2VxX00Ru2xErBY');

	/*const product = await stripe.products.create({
		name: 'Basic Dashboard',
		default_price_data: {
			unit_amount: 1000,
			currency: 'usd',
			recurring: {interval: 'month'},
		},
		expand: ['default_price'],
	});

	*/

	/*prod_MrioFs6Nv47DJw*/


	/*const price = await stripe.prices.create({
		product: 'prod_MrioFs6Nv47DJw',
		unit_amount: 1000,
		currency: 'usd',
		// recurring: {interval: 'month'},
	});

	return res.json({
		price
	})*/



const session = await stripe.checkout.sessions.create({
	line_items: [{
		price: 'price_1M7zSDGptBv4vhDO5C25bidu',
		quantity: 1,
	}],
	mode: 'payment',
	payment_method_types : ['card'],
	success_url: 'https://example.com/success',
	cancel_url: 'https://example.com/failure',
	payment_intent_data: {
		application_fee_amount: 1,
		transfer_data: {
			destination: 'acct_1M8zWKSIqsdzZyif',
		},
	},
});


return res.json({
	session,
	// accountLink
})


/*const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099,
  currency: 'usd',
  payment_method_types: ['card'],
});

clientSecret = setupIntent.client_secret;
*/

}
	
const savePaymentMethod = (req, res) => {
	const paymentMethod = await stripe.paymentMethods.create({
  type: 'card',
  card: {
    number: '4242424242424242',
    exp_month: 11,
    exp_year: 2023,
    cvc: '314',
  },
});
}

const makePayment = (req, res) => {

	$service_name = req.body.title;
	$total_price = round((float)req.body.total_price, 2);
	$app_fee = round($total_price * 0.01 * 2, 2);
	$tax_price = 0;
	$app_fee_stripe = ($app_fee + $tax_price) * 100;
	$total_price_stripe = ($total_price + $tax_price) * 100;
	$talent_stripe_connect = $talent->stripe_connect_id;
	$customer = auth()->user();
	$customer_payment_method = $customer->defaultPaymentMethod();
	$talent_amount = ($total_price - $app_fee);
	$talent_amount_stripe = ($total_price - $app_fee) * 100;
	$payment_intent  = null;               

	$payment_intent = await stripe.paymentIntents.create({
		payment_method_types : ['card'],
		amount : $total_price_stripe,
		description : $service_name,
		customer : $customer->stripe_id,
		// currency : config(services.stripe.currency),
		application_fee_amount : $app_fee_stripe,
		payment_method : $customer_payment_method->id,
		off_session : true,
		confirm : true,
		metadata : [
			order_id : req.body.id,
			order_uuid : req.body.uuid,
			],
		transfer_group : req.body.uuid,
		transfer_data : [
			amount : $talent_amount_stripe,
			destination : $talent_stripe_connect,
			],
	});
}

const index = (req, res) => {
	const queryData = {
		response_type: 'code',
		client_id: config.clientId,
		scope: 'read_write',
		redirect_uri: config.redirectUri
	}
	const connectUri = config.authorizationUri + '?' + httpBuildQuery(queryData);
	return res.json({
		success: true,
		connectUri: connectUri
	})
	res.render('index', { connectUri, error: req.flash('error') })
}

const redirect = async (req, res) => {
	console.log(req.query);
	if (req.query.error) {
		req.flash('error', req.query.error.error_description)
		return res.redirect('/');
	}
	const token = await getToken(req.query.code);
	console.log('aaaaaaa',token);
	if (token.error) {
		return res.redirect('/');
	}
	const connectedAccountId = token.stripe_user_id;
	const account = await getAccount(connectedAccountId);
	if (account.error) {
		return res.redirect('/');
	}
	res.render('account', { account });
}

const getToken = async (code) => {
	let token = {};
	try {
		token = await stripe.oauth.token({ client_secret: 'sk_test_RumEtS503VIgh5EqyxTx2VxX00Ru2xErBY', grant_type: 'authorization_code', code });
	} catch (error) {
		token.error = error.message;
	}
	return token;
}

const getAccount = async (connectedAccountId) => {
	let account = {};
	try {
		account = await stripe.account.retrieve(connectedAccountId);
	} catch (error) {
		account.error = error.message;
	}
	return account;
}

module.exports = {
	index,
	redirect,
	connectStripe
}
