const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth.js')
const { validateAgainstSchema, extractValidFields} = require('../lib/validation')
const { getAllCourses, insertNewCourse, getCourseById, deleteCourseById, updateCourseById, getStudentsByCourse, getAssignmentsByCourse} = require('../models/course')
const {
  CourseSchema,
} = require('../models/course.js')

const {ObjectId} = require('mongodb')

const router = Router()

router.get('/', requireAuthentication, async (req, res) => {
  if(req.role == "admin" && req.user) {
    const courses = await getAllCourses();
    if (courses.length > 0) {
      res.status(201).send(courses);
    } else {
      res.status(400).json({
        error: "There is no course data to retrieve."
      });
    }
  } else {
    res.status(403).send({
      err: "Unauthorized to access the specified resource."
    })
  }
})

router.post('/', requireAuthentication, async (req, res) => {
  if(req.role == "admin" && req.user) {
    if (validateAgainstSchema(req.body, CourseSchema)) {
        const id = await insertNewCourse(req.body);
        res.status(201).send({ id: id });
    } else {
        res.status(400).json({
            error: "Request body is not a valid course object."
        });
    }
  } else {
    res.status(403).send({
      err: "Unauthorized to access the specified resource."
    })
  }
})

router.get('/:id', requireAuthentication, async (req, res) => {
  console.log(req.params.id)
  console.log(req.user.courseId)
    if(req.role == "admin" || req.user.courseId == req.params.id) {
      const courseId = req.params.id;
      const course = await getCourseById(courseId);
      if (course) {
        res.status(200).send(course);
      } else {
        res.status(400).send('The course with the given ID was not found.');
      }
    } else {
      res.status(403).send({
        err: "Unauthorized to access the specified resource."
      })
    }
})

router.put('/:id', requireAuthentication, async function (req, res, next) {
    const courseId = await getCourseById(req.params.id);
    if (!courseId) {
        res.status(400).send({
            err: "The course with the given ID was not found."
          })
    } else if (req.role == "admin" && req.user) {
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
    } else {
        res.status(403).send({
          err: "Unauthorized to access the specified resource."
        })
    }
 });

router.delete('/:id', requireAuthentication, async (req, res) => {
  const courseId = await getCourseById(req.params.id);
  if (!courseId) {
    res.status(400).send({
      err: "The course with the given ID was not found."
    })
  } else if (req.role == "admin" && req.user){
        const deleteSuccessful = await deleteCourseById(req.params.id);
        if (deleteSuccessful) {
        res.status(200).send("Deleted successfully.");
        } else {
        next();
    }
  } else {
    res.status(403).send({
      err: "Unauthorized to access the specified resource."
  })
}
})

router.get('/:id/students',  requireAuthentication, async (req, res) => {
  const courseId = await getCourseById(req.params.id);
  if (!courseId) {
    res.status(400).send({
      err: "The course with the given ID was not found."
    })
  } else if(req.role == "admin" && req.user) {
    const courseId = req.params.id;
    const course = await getStudentsByCourse(courseId);
    if (course.length > 0) { 
        res.status(201).send(course);
      } else {
        res.status(400).json({
          error: "No students for that course."
        });
      }
  } else {
    res.status(403).send({
      err: "Unauthorized to access the specified resource."
  })
  }
})

router.get('/:id/assignments',  requireAuthentication, async (req, res) => {
  const courseId = await getCourseById(req.params.id);
  if (!courseId) {
    res.status(400).send({
      err: "The course with the given ID was not found."
    })
  } else if(req.role == "admin" && req.user) {
    const courseId = req.params.id;
    const course = await getAssignmentsByCourse(courseId);
    if (course.length > 0) { 
        res.status(201).send(course);
    } else {
        res.status(400).json({
          error: "No assignments for that course."
        });
    }
  } else {
      res.status(403).send({
        err: "Unauthorized to access the specified resource."
    })
  }
})



module.exports = router;