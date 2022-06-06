const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth.js')
const { validateAgainstSchema, extractValidFields} = require('../lib/validation')
const {
  AssignmentSchema,
} = require('../models/assignment.js')
const { getAllAssignments, insertNewAssignment, getAssignmentById, deleteAssignmentById, updateAssignmentById} = require('../models/assignment')
const {ObjectId} = require('mongodb')
const router = Router()

router.get('/', requireAuthentication, async (req, res) => {
    if(req.role == "admin" && req.user) {
        const assignments = await getAllAssignments();
        if (assignments.length > 0) {
        res.status(201).send(assignments);
        } else {
        res.status(400).json({
            error: "There is no assignment data to retrieve."
        });
        }
    } else {
        res.status(403).send({
            err: "Unauthorized to access the specified resource."
        })  
    }
})

router.post('/', async (req, res) => {
    if(req.role == "admin" && req.user) {
        if (validateAgainstSchema(req.body, AssignmentSchema)) {
            const id = await insertNewAssignment(req.body);
            res.status(201).send({ id: id });
        } else {
            res.status(400).json({
                error: "Request body is not a valid assignment object."
            });
        }
    } else {
        res.status(403).send({
            err: "Unauthorized to access the specified resource."
          })
    }
})

router.get('/:id', requireAuthentication, async (req, res) => {
    if(req.role == "admin" || req.user.courseId == req.params.id) {
        const assignmentId = req.params.id;
        const assignment = await getAssignmentById(assignmentId);
        if (assignment) {
        res.status(200).send(assignment);
        } else {
            res.status(400).send({
                error: "The assignment with the given ID was not found."
            })        
        }
    } else {
        res.status(403).send({
          err: "Unauthorized to access the specified resource."
        })
    }
})

router.put('/:id', requireAuthentication, async function (req, res, next) {
    const assignmentid = await getAssignmentById(req.params.id);
    if (!assignmentid) {
        res.status(400).send({
        err: "The assignment with the given ID was not found."
        })
    } else if (req.role == "admin" && req.user){
        if (validateAgainstSchema(req.body, AssignmentSchema)) {
            const updateSuccessful = await updateAssignmentById(req.params.id, req.body);
            if (updateSuccessful) {
            res.status(200).send("Updated successfully.");
            } else {
            next();
            }
        } else {
            res.status(400).send({
            err: "Request body does not contain a valid assignment."
            });
        }
    } else {
        res.status(403).send({
            err: "Unauthorized to access the specified resource."
          })
    }
 });

router.delete('/:id', async (req, res) => {
    const assignmentid = await getAssignmentById(req.params.id);
    if (!assignmentid) {
    res.status(400).send({
      err: "The assignment with the given ID was not found."
    })
    } else if(req.role == "admin" && req.user) {
        const deleteSuccessful = await deleteAssignmentById(req.params.id);
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

module.exports = router;