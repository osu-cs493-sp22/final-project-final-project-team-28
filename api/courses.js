const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')

const { validateAgainstSchema, extractValidFields} = require('../lib/validation')
const { getAllCourses, insertNewCourse, getCourseById, deleteCourseById, updateCourseById, getStudentsByCourse} = require('../models/course')
const {
  CourseSchema,
} = require('../models/course.js')

const {ObjectId} = require('mongodb')

const router = Router()

router.get('/', async (req, res) => {
    const courses = await getAllCourses();
    if (courses.length > 0) {
      res.status(201).send(courses);
    } else {
      res.status(400).json({
        error: "There is no course data to retrieve."
      });
    }
})

router.post('/', async (req, res) => {
    if (validateAgainstSchema(req.body, CourseSchema)) {
        const id = await insertNewCourse(req.body);
        res.status(201).send({ id: id });
    } else {
        res.status(400).json({
            error: "Request body is not a valid course object."
        });
    }
})

router.get('/:id', async (req, res) => {
    const courseId = req.params.id;
    const course = await getCourseById(courseId);
    if (course) {
      res.status(200).send(course);
    } else {
      res.status(400).send('The course with the given ID was not found.');
    }
})

router.put('/:id', async function (req, res, next) {
    const courseId = await getCourseById(req.params.id);
    if (!courseId) {
        res.status(400).send({
            err: "The course with the given ID was not found."
          })
    } else {
        if (validateAgainstSchema(req.body, CourseSchema)) {
        const updateSuccessful = await updateCourseById(req.params.id, req.body);
        if (updateSuccessful) {
            res.status(200).send("Updated successfully.");
        } else {
            next();
        }
        } else {
        res.status(400).send({
            err: "Request body does not contain a valid course."
        });
        }
    }
 });

router.delete('/:id', async (req, res) => {
    const courseId = await getCourseById(req.params.id);
    if (!courseId) {
    res.status(400).send({
      err: "The course with the given ID was not found."
    })
  } else {
        const deleteSuccessful = await deleteCourseById(req.params.id);
        if (deleteSuccessful) {
        res.status(200).send("Deleted successfully.");
        } else {
        next();
    }
    }
})

router.get('/:id/students',  async (req, res) => {
    const courseId = req.params.id;
    const course = await getStudentsByCourse(courseId);
    if (course.length > 0) { 
        res.status(201).send(course);
      } else {
        res.status(400).json({
          error: "No students for that course."
        });
      }
})

router.get('/:id/assignments',  async (req, res) => {
    const courseId = req.params.id;
    const course = await getAssignmentsByCourse(courseId);
    if (course.length > 0) { 
        res.status(201).send(course);
      } else {
        res.status(400).json({
          error: "No assignments for that course."
        });
      }
})



module.exports = router;