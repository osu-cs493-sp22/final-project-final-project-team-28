const { ObjectId, GridFSBucket } = require('mongodb');
const { getDbReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
const fs = require('fs');

const SubmissionSchema = {
	assignmentId: { required: true },
	studentId: { required: true },
	timestamp: { required: true },
};
exports.SubmissionSchema = SubmissionSchema;

async function getAllSubmissions() {
	const db = getDbReference();
	const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
	const results = await bucket.find({}).toArray();
	return results;
}
exports.getAllSubmissions = getAllSubmissions;

async function saveSubmissionInfo(submission) {
	const db = getDbReference();
	const collection = db.collection('submissions');
	const result = await collection.insertOne(submission);
	return result.insertedId;
}

exports.saveSubmissionInfo = saveSubmissionInfo;

function saveSubmissionFile(submission) {
	return new Promise(function (resolve, reject) {
		const db = getDbReference();
		const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
		var metadata = {
			assignmentId: submission.assignmentId,
			studentId: submission.studentId,
			timestamp: Math.floor(Date.now() / 1000),
			grade: submission.grade,
			mimetype: submission.mimetype,
			path: submission.path,
		};
		metadata = extractValidFields(submission, SubmissionSchema);
		metadata.mimetype = submission.mimetype;
		metadata.assignmentId = new ObjectId(submission.assignmentId);
		metadata.studentId = new ObjectId(submission.studentId);
		const uploadStream = bucket.openUploadStream(submission.filename, {
			metadata: metadata,
		});
		fs.createReadStream(submission.path)
			.pipe(uploadStream)
			.on('error', function (err) {
				reject(err);
			})
			.on('finish', function (result) {
				console.log('== stream result for saveSubmissionFile:', result);
				resolve(result._id);
			});
	});
}
exports.saveSubmissionFile = saveSubmissionFile;

function removeUploadedFile(path) {
	return new Promise((resolve, reject) => {
		fs.unlink(path, (err) => {
			if (err) {
				reject(err);
			} else {
				console.log('path removed.');
				console.log('path: ', path);
				resolve();
			}
		});
	});
}
exports.removeUploadedFile = removeUploadedFile;

function getSubmissionDownloadStream(id) {
	id = id.split('.')[0];
	const db = getDbReference();
	const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
	id = new ObjectId(id);
	return bucket.openDownloadStream(id);
}

exports.getSubmissionDownloadStream = getSubmissionDownloadStream;

async function getAssignmentSubmissions(id) {
	const db = getDbReference();
	const collection = db.collection('submissions.files');
	const submissions = await collection
		.find({ 'metadata.assignmentId': new ObjectId(id) })
		.toArray();
	return submissions;
}
exports.getAssignmentSubmissions = getAssignmentSubmissions;

async function getSubmissionsPage(page) {
	const db = getDbReference()
	const collection = db.collection('submissions.files')
	const count = await collection.countDocuments()

	const pageSize = 5
	const lastPage = Math.ceil(count / pageSize)
	page = page > lastPage ? lastPage : page
	page = page < 1 ? 1 : page
	const offset = (page - 1) * pageSize
  
	const results = await collection.find({})
	  .sort({ _id: 1 })
	  .skip(offset)
	  .limit(pageSize)
	  .toArray()
  
	return {
	  submissions: results,
	  page: page,
	  totalPages: lastPage,
	  pageSize: pageSize,
	  count: count
	}
  }
  exports.getSubmissionsPage = getSubmissionsPage