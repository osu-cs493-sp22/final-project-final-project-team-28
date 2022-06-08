const { Router } = require('express');
const { requireAuthentication } = require('../lib/auth.js');
const { validateAgainstSchema } = require('../lib/validation');
const { AssignmentSchema } = require('../models/assignment.js');
const crypto = require('crypto');
const multer = require('multer');
const { getCourseById, getStudentsByCourse } = require('../models/course.js');
const {
	insertNewAssignment,
	getAssignmentById,
	deleteAssignmentById,
	updateAssignmentById,
} = require('../models/assignment');
const {
	SubmissionSchema,
	saveSubmissionFile,
	removeUploadedFile,
	getAssignmentSubmissions,
} = require('../models/submission');

const photoTypes = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
};

const router = Router();

const upload = multer({
	storage: multer.diskStorage({
		destination: `${__dirname}/uploads`,
		filename: function (req, file, callback) {
			const ext = photoTypes[file.mimetype];
			const filename = crypto.pseudoRandomBytes(16).toString('hex');
			callback(null, `${filename}.${ext}`);
		},
	}),
	fileFilter: function (req, file, callback) {
		callback(null, !!photoTypes[file.mimetype]);
	},
});

router.post('/', requireAuthentication, async (req, res) => {
	if (validateAgainstSchema(req.body, AssignmentSchema)) {
		const course = await getCourseById(req.body.courseId);
		if (
			(req.role === 'admin' && req.user) ||
			(req.role === 'instructor' && req.user === course.instructorId)
		) {
			const id = await insertNewAssignment(req.body);
			res.status(201).send({ id: id });
		} else {
			res.status(403).send({
				err: 'Unauthorized to access the specified resource.',
			});
		}
	} else {
		res.status(400).json({
			error: 'Request body is not a valid assignment object.',
		});
	}
});

router.get('/:id', async (req, res) => {
	const assignmentId = req.params.id;
	const assignment = await getAssignmentById(assignmentId);
	if (assignment) {
		res.status(200).send(assignment);
	} else {
		res.status(400).send({
			error: 'The assignment with the given ID was not found.',
		});
	}
});

router.put('/:id', requireAuthentication, async (req, res, next) => {
	if (validateAgainstSchema(req.body, AssignmentSchema)) {
		const course = await getCourseById(req.body.courseId);
		if (
			(req.role === 'admin' && req.user) ||
			(req.role === 'instructor' && req.user === course.instructorId)
		) {
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
			res.status(403).send({
				err: 'Unauthorized to access the specified resource.',
			});
		}
	} else {
		res.status(400).json({
			error: 'Request body is not a valid assignment object.',
		});
	}
});

router.delete('/:id', requireAuthentication, async (req, res) => {
	const assignment = await getAssignmentById(req.params.id);
	if (!assignment) {
		res.status(400).send({
			err: 'The assignment with the given ID was not found.',
		});
	}
	const course = await getCourseById(assignment.courseId);
	if (
		(req.role === 'admin' && req.user) ||
		(req.role === 'instructor' && req.user === course.instructorId)
	) {
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

router.get(
	'/:id/submissions',
	requireAuthentication,
	async function (req, res) {
		const assignment = await getAssignmentById(req.params.id);
		if (!assignment) {
			res.status(400).send({
				err: 'The assignment with the given ID was not found.',
			});
		}
		const course = await getCourseById(assignment.courseId);
		if (
			(req.role === 'admin' && req.user) ||
			(req.role === 'instructor' && req.user === course.instructorId)
		) {
			const submissions = await getAssignmentSubmissions(req.params.id);
			res.status(201).send({ submissions: submissions });
		} else {
			res.status(403).send({
				err: 'Unauthorized to access the specified resource.',
			});
		}
	}
);

router.post(
	'/:id/submissions',
	upload.single('file'),
	requireAuthentication,
	async (req, res, next) => {
		if (!validateAgainstSchema(req.body, SubmissionSchema)) {
			res.status(400).send({
				err: 'Request body needs a valid submission object.',
			});
		}
		const assignment = await getAssignmentById(req.body.assignmentId);
		const students = await getStudentsByCourse(assignment.courseId);
		if (req.role === 'student' && students.indexOf(students) !== 0) {
			try {
				const submission = {
					assignmentId: req.body.assignmentId,
					studentId: req.body.studentId,
					timestamp: Math.floor(Date.now() / 1000),
					grade: req.body.grade,
					path: req.file.path,
					filename: req.file.filename,
					mimetype: req.file.mimetype,
				};
				const id = await saveSubmissionFile(submission);
				await removeUploadedFile(submission.path);
				res.status(200).send({ id: id });
			} catch (err) {
				next(err);
			}
		} else {
			res.status(403).send({
				err: 'Unauthorized to access the specified resource.',
			});
		}
	}
);

module.exports = router;
