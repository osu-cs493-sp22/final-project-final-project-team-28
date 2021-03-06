const { Router } = require('express');
const { requireAuthentication } = require('../lib/auth.js');
const { validateAgainstSchema } = require('../lib/validation');
const {
	getAllCourses,
	insertNewCourse,
	getCourseById,
	deleteCourseById,
	updateCourseById,
	getStudentsByCourse,
	getAssignmentsByCourse,
	addStudentsToCourse,
	removeStudentsFromCourse,
	getCoursesPage
} = require('../models/course');
const { CourseSchema } = require('../models/course.js');

const router = Router();

router.get('/', async (req, res) => {
	/*
	const courses = await getAllCourses();
	if (courses.length > 0) {
		res.status(201).send(courses);
	} else {
		res.status(400).json({
			error: 'There is no course data to retrieve.',
		});
	}*/
	try {
		const coursePage = await getCoursesPage(parseInt(req.query.page) || 1)
		coursePage.links = {}
		if (coursePage.page < coursePage.totalPages) {
			coursePage.links.nextPage = `/courses?page=${coursePage.page + 1}`
			coursePage.links.lastPage = `/courses?page=${coursePage.totalPages}`
		}
		if (coursePage.page > 1) {
			coursePage.links.prevPage = `/courses?page=${coursePage.page - 1}`
			coursePage.links.firstPage = '/courses?page=1'
		}
		res.status(200).send(coursePage)
	  } catch (err) {
		console.error(err)
		res.status(500).send({
		  error: "Error fetching courses list.  Please try again later."
		})
	  }
});

router.post('/', requireAuthentication, async (req, res) => {
	if (req.role == 'admin' && req.user) {
		if (validateAgainstSchema(req.body, CourseSchema)) {
			const id = await insertNewCourse(req.body);
			res.status(201).send({ id: id });
		} else {
			res.status(400).json({
				error: 'Request body is not a valid course object.',
			});
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.get('/:id', async (req, res) => {
	const course = await getCourseById(req.params.id);
	if (course) {
		res.status(200).send(course);
	} else {
		res.status(400).send({
			err: 'The course with the given ID was not found.',
		});
	}
});

router.put('/:id', requireAuthentication, async function (req, res, next) {
	const course = await getCourseById(req.params.id);
	if (!course) {
		res.status(400).send({
			err: 'The course with the given ID was not found.',
		});
	} else if (
		(req.role == 'admin' && req.user) ||
		(req.role == 'instructor' && req.user === course.instructorId)
	) {
		if (validateAgainstSchema(req.body, CourseSchema)) {
			const updateSuccessful = await updateCourseById(
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
				err: 'Request body does not contain a valid course.',
			});
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.delete('/:id', requireAuthentication, async (req, res) => {
	const courseId = await getCourseById(req.params.id);
	if (!courseId) {
		res.status(400).send({
			err: 'The course with the given ID was not found.',
		});
	} else if (req.role == 'admin' && req.user) {
		const deleteSuccessful = await deleteCourseById(req.params.id);
		if (deleteSuccessful) {
			res.status(200).send({
				err: 'Deleted successfully.',
			});
		} else {
			next();
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.get('/:id/students', requireAuthentication, async (req, res) => {
	const course = await getCourseById(req.params.id);
	if (!course) {
		res.status(400).send({
			err: 'The course with the given ID was not found.',
		});
	} else if (
		(req.role == 'admin' && req.user) ||
		(req.role == 'instructor' && req.user === course.instructorId)
	) {
		const students = await getStudentsByCourse(req.params.id);
		if (students.length > 0) {
			res.status(201).send(students);
		} else {
			res.status(400).json({
				error: 'No students for that course.',
			});
		}
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.post('/:id/students', requireAuthentication, async (req, res) => {
	const course = await getCourseById(req.params.id);
	if (!course) {
		res.status(400).send({
			err: 'The course with the given ID was not found.',
		});
	} else if (!req.body.add || !req.body.remove) {
		res.status(400).json({
			error: 'Request body must include list of student IDs to add and remove to course',
		});
	} else if (
		(req.role == 'admin' && req.user) ||
		(req.role == 'instructor' && req.user === course.instructorId)
	) {
		const studentsToAdd = req.body.add;
		const studentsToRemove = req.body.remove;
		await addStudentsToCourse(req.params.id, studentsToAdd);
		await removeStudentsFromCourse(req.params.id, studentsToRemove);
		res.status(201).send('Enrollment updated for course');
	} else {
		res.status(403).send({
			err: 'Unauthorized to access the specified resource.',
		});
	}
});

router.get('/:id/assignments', async (req, res) => {
	const courseId = req.params.id;
	const course = await getCourseById(courseId);
	if (course) {
		const assignments = await getAssignmentsByCourse(courseId);
		if (assignments.length > 0) {
			res.status(201).send(assignments);
		} else {
			res.status(400).json({
				error: 'No assignments for that course.',
			});
		}
	} else {
		res.status(400).send({
			err: 'The course with the given ID was not found.',
		});
	}
});

module.exports = router;
