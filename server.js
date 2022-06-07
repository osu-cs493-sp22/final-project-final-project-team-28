const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const { connectToDb } = require('./lib/mongo');

const app = express();
const port = 8000;
/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

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
