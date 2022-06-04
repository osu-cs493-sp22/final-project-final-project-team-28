const { getDbReference } = require('../lib/mongo')
const {ObjectId} = require('mongodb')
const { validateAgainstSchema, extractValidFields} = require('../lib/validation')

const AssignmentSchema = {
  courseId: { required: true },
  title: { required: true },
  points: { required: true },
  dueDate: { required: true },
  courseId: {required: true}
}
exports.AssignmentSchema = AssignmentSchema

async function getAllAssignments() {
    const db = getDbReference()
    const collection = db.collection('assignments')
    const assignments = await collection.find({}).toArray()
    return assignments
  }
exports.getAllAssignments = getAllAssignments

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
exports.insertNewAssignment = insertNewAssignment


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
exports.getAssignmentById = getAssignmentById

async function updateAssignmentById(id, assignment) {
    const db = getDbReference()
    let assignmentValues = {};
    if(validateAgainstSchema(assignment, AssignmentSchema)) {
    assignmentValues = extractValidFields(assignment, AssignmentSchema);
    const collection = db.collection('assignments');
    if (ObjectId.isValid(id)) {
          const result = await collection.replaceOne(
          { _id: new ObjectId(id) },
          assignmentValues
        );
          return result.matchedCount > 0;
      } else {
        return null;
      }
    } else {
      return null;
    } 
  }
exports.updateAssignmentById = updateAssignmentById

async function deleteAssignmentById(id) {
    const db = getDbReference();
    const collection = db.collection('assignments');
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  }
exports.deleteAssignmentById = deleteAssignmentById

