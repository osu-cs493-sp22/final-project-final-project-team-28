const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { validateAgainstSchema } = require('../lib/validation')
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth.js')
const { insertNewUser, emailAlreadyUsed, getUserByEmail, getUserById, getAllUsers, deleteUserById} = require('../models/user')
const { UserSchema } = require('../models/user')

const router = Router()

router.get('/', requireAuthentication, async (req, res) => {
    if (req.role === 'admin' && req.user) {
        const users = await getAllUsers();
        if (users.length > 0) {
            res.status(201).send(users);
        } else {
            res.status(400).json({
                error: "There is no user data to retrieve."
            });
        }
    } else {
        res.status(403).send({
            err: "Unauthorized to access the specified resource."
        })
    }
})
router.post('/', optionalAuthentication, async (req, res, next) => {
    if (validateAgainstSchema(req.body, UserSchema)) {
        const emailTaken = await emailAlreadyUsed(req.body.email)
        if (emailTaken) {
            res.status(400).send({
                error: "Email already taken"
            })
        } else {
            if (req.user != "admin" && req.body.role == "admin") {
                res.status(400).send({
                  error: "Only admins can create other admin users."
                })  
            } else if (req.body.role == "admin") {
                res.status(400).send({
                    error: "Only admins can create other admin users."
                  }) 
            } else {
                const id = await insertNewUser(req.body)
                res.status(201).send({
                    _id: id
                })
            }
        }
    } else {
        res.status(400).send({
            error: "Request body does not contain a valid User."
        })
    }
})

router.post('/login', async function(req, res) {
    if (req.body && req.body.email && req.body.password) {
        const user = await getUserByEmail(req.body.email, true)
        const authenticated = user && await bcrypt.compare(
            req.body.password,
            user.password
        )
        if (authenticated) {
            const token = generateAuthToken(user._id, user.role)
            res.status(200).send({
                token: token
            })
        } else {
            res.status(401).send({
                error: "Invalid credentials"
            })
        }
    } else {
        res.status(400).send({
            error: "Request needs email and password."
        })
    }
})


router.get('/:id', requireAuthentication, async function(req, res, next) {
    const userid = await getUserById(req.params.id);
    if (!userid) {
      res.status(400).send({
        err: "The user with the given ID was not found."
      })
    } else {
        if (req.role === 'admin' || req.user == req.params.id) {
            const user = await getUserById(req.params.id)
            if (user) {
                res.status(200).send(user)
            } else {
                next()
            }
        } else {
            res.status(403).send({
                err: "Unauthorized to access the specified resource."
            })
        }
    }
})

router.delete('/:id', requireAuthentication, async function (req, res, next) {
    const userid = await getUserById(req.params.id);
    if (!userid) {
      res.status(400).send({
        err: "The user with the given ID was not found."
      })
    } else if (req.role === 'admin' || (req.user == userid._id.toString() && userid._id.toString() == req.params.id)) {
            console.log(req.user)
            console.log(userid._id.toString())
            console.log(req.params.id)
            const deleteSuccessful = await deleteUserById(req.params.id);
            if (deleteSuccessful) {
                res.status(200).send("Deleted successfully.");
            } else {
                res.status(403).send({
                    err: "Unauthorized to access the specified resource."
                })
            }
    } else {
            res.status(403).send({
                err: "Unauthorized to access the specified resource."
            })
    }});

module.exports = router