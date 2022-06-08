const { Router } = require('express');
const { requireAuthentication } = require('../lib/auth.js');
const { validateAgainstSchema } = require('../lib/validation');
const { AssignmentSchema } = require('../models/assignment.js');
const {
	getAllAssignments,
	insertNewAssignment,
	getAssignmentById,
	deleteAssignmentById,
	updateAssignmentById,
} = require('../models/assignment');
const router = Router();

router.get('/', requireAuthentication, async (req, res) => {
	if (req.role == 'admin' && req.user) {
		const assignments = await getAllAssignments();
		if (assignments.length > 0) {
			res.status(201).send(assignments);
		} else {
			res.status(400).json({
				error: 'There is no assignment data to retrieve.',
			});
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.post('/', async (req, res) => {
	if (req.role == 'admin' && req.user) {
		if (validateAgainstSchema(req.body, AssignmentSchema)) {
			const id = await insertNewAssignment(req.body);
			res.status(201).send({ id: id });
		} else {
			res.status(400).json({
				error: 'Request body is not a valid assignment object.',
			});
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.get('/:id', requireAuthentication, async (req, res) => {
	if (req.role == 'admin' || req.user.courseId == req.params.id) {
		const assignmentId = req.params.id;
		const assignment = await getAssignmentById(assignmentId);
		if (assignment) {
			res.status(200).send(assignment);
		} else {
			res.status(400).send({
				error: 'The assignment with the given ID was not found.',
			});
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.put('/:id', requireAuthentication, async (req, res, next) => {
	const assignmentid = await getAssignmentById(req.params.id);
	if (!assignmentid) {
		res.status(400).send({
			err: 'The assignment with the given ID was not found.',
		});
	} else if (req.role == 'admin' && req.user) {
		if (validateAgainstSchema(req.body, AssignmentSchema)) {
			const updateSuccessful = await updateAssignmentById(
				req.params.id,
				req.body
			);
			if (updateSuccessful) {
				res.status(200).send('Updated successfully.');
			} else {
				next();
			}
		} else {
			res.status(400).send({
				err: 'Request body does not contain a valid assignment.',
			});
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.delete('/:id', async (req, res) => {
	const assignmentid = await getAssignmentById(req.params.id);
	if (!assignmentid) {
		res.status(400).send({
			err: 'The assignment with the given ID was not found.',
		});
	} else if (req.role == 'admin' && req.user) {
		const deleteSuccessful = await deleteAssignmentById(req.params.id);
		if (deleteSuccessful) {
			res.status(200).send('Deleted successfully.');
		} else {
			next();
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});
const crypto = require('crypto');
const multer = require('multer');
const { SubmissionSchema, saveSubmissionFile, getSubmissionInfoById, removeUploadedFile} = require('../models/submission');
const photoTypes = {
	'image/jpeg': 'jpg',
	'image/png': 'png'
  };
const upload = multer({ 
	storage: multer.diskStorage({
	  destination: `${__dirname}/uploads`,
	  filename: function (req, file, callback) {
	   const ext = photoTypes[file.mimetype]
	   const filename = crypto.pseudoRandomBytes(16).toString('hex')
	   callback(null, `${filename}.${ext}`)
	  }
	}),
	fileFilter: function (req, file, callback) {
	  callback(null, !!photoTypes[file.mimetype])
	}
  });

router.post('/:id/submissions', upload.single('file'),  async (req, res, next) => {
    console.log("== req.file:", req.file)
    console.log("== req.body:", req.body)
    if ((validateAgainstSchema(req.body, SubmissionSchema))) {
        try {
            const submission = {
				assignmentId: req.body.assignmentId,
				studentId: req.body.studentId,
				timestamp: Math.floor(Date.now() /1000),
				grade: req.body.grade,
				path: req.file.path,
				filename: req.file.filename,
				mimetype: req.file.mimetype
            }
            const id = await saveSubmissionFile(submission)
			await removeUploadedFile(submission.path)
			res.status(200).send({ id: id })
          } catch (err) {
            next (err)
          }
    } else {
        res.status(400).send({
          err: "Request body needs a valid submission object."
        })
  }
  })
  
router.get('/:id/submissions', async function (req,res,next) {
    try {
		const submission = await getSubmissionInfoById(req.params.id);
		console.log(submission)
		if (submission) {
		  const resBody = {
			_id: submission._id,
			submission: `/media/submissions/${submission._id}.${photoTypes[submission.metadata.mimetype]}`,
			mimetype: submission.metadata.mimetype,
			assignmentId: submission.assignmentId,
			studentId: submission.studentId,
			timestamp: submission.timestamp,
			grade: submission.grade,
		  }
		  res.status(200).send(resBody);
		} else {
		  next();
		}
	  } catch (err) {
		next(err);
	  }
  })

module.exports = router;
