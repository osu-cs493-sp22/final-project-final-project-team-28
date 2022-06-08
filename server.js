const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const { connectToDb } = require('./lib/mongo');

const app = express();
const port = process.env.PORT || 8000;
const redis = require('redis')
const redisHost = process.env.REDIS_HOST
const redisPort = process.env.REDIS_PORT || 6379

// const redisClient = redis.createClient(redisHost, redisPort)

// const rateLimitMaxRequests = 5
// const rateLimitWindowMs = 60000

// async function rateLimit(req, res, next) {
// 	const ip = req.ip
// 	const now = Date.now()

// 	let tokenBucket
// 	try {
// 	  	tokenBucket = await redisClient.hGetAll(ip)
// 	}
// 	catch (e) {
// 		next()
// 		return
// 	}

// 	tokenBucket = {
// 		tokens: parseFloat(tokenBucket.tokens) || rateLimitMaxRequests,
// 		last: parseInt(tokenBucket.last) || now
// 	}
// 	const elapsedMs = now - tokenBucket.last

// 	tokenBucket.tokens += elapsedMs * (rateLimitMaxRequests / rateLimitWindowMs)
//   	tokenBucket.tokens = Math.min(rateLimitMaxRequests, tokenBucket.tokens)
//   	tokenBucket.last = now

// 	if (tokenBucket.tokens >= 1) {
// 		tokenBucket.tokens -= 1
// 		await redisClient.hSet(ip, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
// 		next()
// 	}
// 	else {
// 		await redisClient.hSet(ip, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
// 		res.status(429).send({
// 			err: "Too many requests per minute"
// 		})
// 	}
// }
/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

// app.use(rateLimit);

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (err, req, res, next) {
	console.log(err);
	res.status(404).json({
		error: 'Requested resource ' + req.originalUrl + ' does not exist',
	});
});

connectToDb(() => {
	app.listen(port, function () {
		console.log('== Server is running on port', port);
	});
});
