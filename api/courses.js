const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')

const { validateAgainstSchema, extractValidFields} = require('../lib/validation')
const {
  CourseSchema,
} = require('../models/course.js')

const {ObjectId} = require('mongodb')

const router = Router()

async function getAllCourses() {
    const db = getDbReference()
    const collection = db.collection('courses')
    const photos = await collection.find({}).toArray()
    return photos
  }

async function insertNewCourse(course) {
    let courseValues = {};
    if (validateAgainstSchema(course, CourseSchema)) {
      const db = getDbReference();
      courseValues = extractValidFields(course, CourseSchema);
      const collection = db.collection('courses');
      const result = await collection.insertOne(courseValues);
      return result.insertedId;
    } else {
      return null;
    }
  }

async function getCourseById(id) {
    const db = getDbReference();
    const collection = db.collection('courses')
   if (ObjectId.isValid(id)) {
      const courses = await collection.find({
        _id: new ObjectId(id)
      }).toArray();
      return courses[0]
    } else {
      return null;
    }
}


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
    console.log(req.params.id)
    const course = await getCourseById(courseId);
    if (course) {
      res.status(200).send(course);
    } else {
      res.status(400).send('The course with the given ID was not found.');
    }
})


module.exports = router;