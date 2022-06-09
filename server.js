const express = require('express');
const morgan = require('morgan');
const redis = require('redis')

const api = require('./api');
const { optionalAuthentication } = require('./lib/auth');
const { connectToDb } = require('./lib/mongo');

const app = express();
const port = process.env.PORT || 8000;

const redisHost = process.env.REDIS_HOST || 'localhost'//'final-project-final-project-team-28-redis-1'
const redisPort = process.env.REDIS_PORT || 6379

const redisClient = redis.createClient({url: `redis://${redisHost}:${redisPort}`})

const rateLimitMaxRequests = 10
const rateLimitMaxRequestsUser = 30
const rateLimitWindowMs = 60000

async function rateLimit(req, res, next) {
	const role = req.role
 	const ip = req.ip
 	const now = Date.now()

 	let tokenBucket
 	try {
 	  	tokenBucket = await redisClient.hGetAll(ip)
 	}
 	catch (e) {
 		next()
 		return
 	}

	tokenBucket = {
		tokens: parseFloat(tokenBucket.tokens) || rateLimitMaxRequests,
		last: parseInt(tokenBucket.last) || Date.now()
	}

	const elapsedMs = now - tokenBucket.last

	if (role != undefined) {
		tokenBucket.tokens += elapsedMs * (rateLimitMaxRequestsUser / rateLimitWindowMs)
	}
	else {
		tokenBucket.tokens += elapsedMs * (rateLimitMaxRequests / rateLimitWindowMs)
	}
  	
	tokenBucket.tokens = Math.min(rateLimitMaxRequests, tokenBucket.tokens)

  	tokenBucket.last = now
	
	//console.log("timeValue:", elapsedMs * (rateLimitMaxRequests / rateLimitWindowMs))

	if (tokenBucket.tokens >= 1) {
		tokenBucket.tokens -= 1
		await redisClient.hSet(ip, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
		next()
	} 
	else {
		await redisClient.hSet(ip, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
		res.status(429).send({
			err: "Too many requests per minute"
		})
	}
}
/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

app.use(optionalAuthentication, rateLimit);

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

redisClient.connect().then(connectToDb(() => {
	app.listen(port, function () {
		console.log('== Server is running on port', port);
	});
}))

/*
connectToDb(() => {
	app.listen(port, function () {
		console.log('== Server is running on port', port);
	});
});
*/

