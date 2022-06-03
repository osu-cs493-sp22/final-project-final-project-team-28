const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')
const { validateAgainstSchema, extractValidFields} = require('../lib/validation')
const {
  AssignmentSchema,
} = require('../models/assignment.js')
const {ObjectId} = require('mongodb')
const router = Router()

async function getAllAssignments() {
    const db = getDbReference()
    const collection = db.collection('assignments')
    const photos = await collection.find({}).toArray()
    return photos
  }

async function insertNewAssignment(assignment) {
    let assignmentValues = {};
    if (validateAgainstSchema(assignment, AssignmentSchema)) {
      const db = getDbReference();
      assignmentValues = extractValidFields(assignment, AssignmentSchema);
      const collection = db.collection('assignments');
      const result = await collection.insertOne(assignmentValues);
      return result.insertedId;
    } else {
      return null;
    }
  }

async function getAssignmentById(id) {
    const db = getDbReference();
    const collection = db.collection('assignments')
   if (ObjectId.isValid(id)) {
      const assignments = await collection.find({
        _id: new ObjectId(id)
      }).toArray();
      return assignments[0]
    } else {
      return null;
    }
}


router.get('/', async (req, res) => {
    const assignments = await getAllAssignments();
    if (assignments.length > 0) {
      res.status(201).send(assignments);
    } else {
      res.status(400).json({
        error: "There is no assignment data to retrieve."
      });
    }
})

router.post('/', async (req, res) => {
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
        const id = await insertNewAssignment(req.body);
        res.status(201).send({ id: id });
    } else {
        res.status(400).json({
            error: "Request body is not a valid assignment object."
        });
    }
})

router.get('/:id', async (req, res) => {
    const assignmentId = req.params.id;
    const assignment = await getAssignmentById(assignmentId);
    if (assignment) {
      res.status(200).send(assignment);
    } else {
      res.status(400).send('The assignment with the given ID was not found.');
    }
})


module.exports = router;