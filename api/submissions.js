const { Router } = require('express');
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { SubmissionSchema, getAllSubmissions} = require('../models/submission');

const router = Router();

router.get('/', async function (req,res,next) {
    const submissions = await getAllSubmissions();
    if (submissions.length > 0) {
      res.status(201).send(submissions);
    } else {
      res.status(400).json({
        error: "There is no submissions to retrieve."
      });
    }
  })


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
