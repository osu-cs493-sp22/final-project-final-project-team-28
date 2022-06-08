const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { validateAgainstSchema } = require('../lib/validation');
const {
	generateAuthToken,
	requireAuthentication,
	optionalAuthentication,
} = require('../lib/auth.js');
const {
	insertNewUser,
	emailAlreadyUsed,
	getUserByEmail,
	getUserById,
} = require('../models/user');
const { UserSchema } = require('../models/user');

const router = Router();

router.post('/', optionalAuthentication, async (req, res, next) => {
	if (validateAgainstSchema(req.body, UserSchema)) {
		const emailTaken = await emailAlreadyUsed(req.body.email);
		if (emailTaken) {
			res.status(400).send({
				error: 'Email already taken',
			});
		} else if (req.role != 'admin' && req.body.role == 'admin') {
			res.status(400).send({
				error: 'Only admins can create admin users.',
			});
		} else if (req.role != 'admin' && req.body.role == 'instructor') {
			res.status(400).send({
				error: 'Only admins can create instructor users.',
			});
		} else {
			const id = await insertNewUser(req.body);
			res.status(201).send({
				_id: id,
			});
		}
	} else {
		res.status(400).send({
			error: 'Request body does not contain a valid User.',
		});
	}
});

router.post('/login', async (req, res) => {
	if (req.body && req.body.email && req.body.password) {
		const user = await getUserByEmail(req.body.email, true);
		const authenticated =
			user && (await bcrypt.compare(req.body.password, user.password));
		if (authenticated) {
			const token = generateAuthToken(user._id, user.role);
			res.status(200).send({
				token: token,
			});
		} else {
			res.status(401).send({
				error: 'Invalid credentials',
			});
		}
	} else {
		res.status(400).send({
			error: 'Request needs email and password.',
		});
	}
});

router.get('/:id', requireAuthentication, async (req, res, next) => {
	const userid = await getUserById(req.params.id);
	if (!userid) {
		res.status(400).send({
			err: 'The user with the given ID was not found.',
		});
	} else {
		if (req.role === 'admin' || req.user == req.params.id) {
			const user = await getUserById(req.params.id);
			if (user) {
				res.status(200).send(user);
			} else {
				next();
			}
		} else {
			res.status(403).send({
				err: 'Unauthorized to access the specified resource.',
			});
		}
	}
});

module.exports = router;
