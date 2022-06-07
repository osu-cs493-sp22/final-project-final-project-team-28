const { Router } = require('express');
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { SubmissionSchema } = require('../models/submission');

const router = Router();

// router.post('/', async function(req, res, next) {
//     if (validateAgainstSchema(req.body, UserSchema)) {
//         const emailTaken = await emailAlreadyUsed(req.body.email)
//         if (emailTaken) {
//             res.status(400).send({
//                 error: "Email already taken"
//             })
//         } else {
//             const id = await insertNewUser(req.body)
//             res.status(201).send({
//                 _id: id
//             })
//         }
//     } else {
//         res.status(400).send({
//             error: "Request body does not contain a valid User."
//         })
//     }
// })

// router.post('/login', async function(req, res) {
//     if (req.body && req.body.email && req.body.password) {
//         const user = await getUserByEmail(req.body.email, true)
//         const authenticated = user && await bcrypt.compare(
//             req.body.password,
//             user.password
//         )
//         if (authenticated) {
//             const token = generateAuthToken(user._id, user.role)
//             res.status(200).send({
//                 token: token
//             })
//         } else {
//             res.status(401).send({
//                 error: "Invalid credentials"
//             })
//         }
//     } else {
//         res.status(400).send({
//             error: "Request needs email and password."
//         })
//     }
// })

// router.get('/:id', requireAuthentication, async function(req, res, next) {
//     if (req.role === 'admin' || req.user == req.params.id) {
//         const user = await getUserById(req.params.id)
//         if (user) {
//             res.status(200).send(user)
//         } else {
//             next()
//         }
//     } else {
//         res.status(403).send({
//             err: "Unauthorized to access the specified resource."
//         })
//     }
// })

module.exports = router;
