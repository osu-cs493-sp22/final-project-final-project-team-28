const { ObjectId, GridFSBucket } = require('mongodb');
const { getDbReference } = require('../lib/mongo');
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const fs = require('fs')
const SubmissionSchema = {
	assignmentId: { required: true },
	studentId: { required: true },
	timestamp: { required: true },
	grade: { required: true }
};
exports.SubmissionSchema = SubmissionSchema;


async function getAllSubmissions() {
	const db = getDbReference();
	const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
	const results = await bucket.find({})
	.toArray();
	return results;
   }
exports.getAllSubmissions= getAllSubmissions

async function saveSubmissionInfo(submission) {
	const db = getDbReference();
	const collection = db.collection('submissions');
	const result = await collection.insertOne(submission);
	return result.insertedId;
};

exports.saveSubmissionInfo = saveSubmissionInfo;

function saveSubmissionFile(submission) {
	return new Promise(function (resolve, reject) {
	  const db = getDbReference();
	  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
	  var metadata = { 
		assignmentId: submission.assignmentId,
		studentId: submission.studentId,
		timestamp: Math.floor(Date.now() /1000),
		grade: submission.grade,
		mimetype: submission.mimetype,
		path: submission.path
	  }
	  metadata = extractValidFields(submission, SubmissionSchema);
	  metadata.mimetype =	submission.mimetype;
	  metadata.assignmentId = new ObjectId(submission.assignmentId)
	  metadata.studentId = new ObjectId(submission.studentId)
	  const uploadStream = bucket.openUploadStream(submission.filename, {
	   metadata: metadata
	 })
	   fs.createReadStream(submission.path).pipe(uploadStream)
	   .on('error', function (err) {
		 reject(err)
	   })
	   .on('finish', function (result) {
		  console.log("== stream result for saveSubmissionFile:", result)
		  resolve(result._id)
	   })
	})
  }
  exports.saveSubmissionFile = saveSubmissionFile

  function removeUploadedFile(path) {
	return new Promise((resolve, reject) => {
	  fs.unlink(path, (err) => {
		if (err) {
		  reject(err);
		} else {
		  console.log("path removed.")
		  console.log("path: ", path)
		  resolve();
		}
	  });
	});
  }
  exports.removeUploadedFile = removeUploadedFile

  function getSubmissionDownloadStream(id) {
	id = id.split('.')[0]
	const db = getDbReference();
	const bucket = new GridFSBucket(db, { bucketName: 'submissions'})
	id = new ObjectId(id)
	return bucket.openDownloadStream(id)
  }
  
  exports.getSubmissionDownloadStream = getSubmissionDownloadStream

  async function getSubmissionInfoById(id) {
	const db = getDbReference();
	const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
	if (!ObjectId.isValid(id)) {
	  return null;
	} else {
	  const results = await bucket.find({ _id: new ObjectId(id) })
		.toArray();
	  return results[0];
	}
  };
  exports.getSubmissionInfoById = getSubmissionInfoById 
  