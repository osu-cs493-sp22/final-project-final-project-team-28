const { getDbReference } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const {
	validateAgainstSchema,
	extractValidFields,
} = require('../lib/validation');

const CourseSchema = {
	subject: { required: true },
	number: { required: true },
	title: { required: true },
	term: { required: true },
	instructorId: { required: true },
};
exports.CourseSchema = CourseSchema;

async function getAllCourses() {
	const db = getDbReference();
	const collection = db.collection('courses');
	const courses = await collection.find({}).toArray();
	return courses;
}
exports.getAllCourses = getAllCourses;

async function insertNewCourse(course) {
	let courseValues = {};
	if (validateAgainstSchema(course, CourseSchema)) {
		const db = getDbReference();
		courseValues = extractValidFields(course, CourseSchema);
		courseValues.students = [];
		courseValues.assignments = [];
		const collection = db.collection('courses');
		const result = await collection.insertOne(courseValues);
		return result.insertedId;
	} else {
		return null;
	}
}
exports.insertNewCourse = insertNewCourse;

async function getCourseById(id) {
	const db = getDbReference();
	const collection = db.collection('courses');
	if (ObjectId.isValid(id)) {
		const courses = await collection
			.find({
				_id: new ObjectId(id),
			})
			.toArray();
		return courses[0];
	} else {
		return null;
	}
}
exports.getCourseById = getCourseById;

async function updateCourseById(id, course) {
	const db = getDbReference();
	let courseValues = {};
	if (validateAgainstSchema(course, CourseSchema)) {
		courseValues = extractValidFields(course, CourseSchema);
		const collection = db.collection('courses');
		if (ObjectId.isValid(id)) {
			const result = await collection.replaceOne(
				{ _id: new ObjectId(id) },
				courseValues
			);
			return result.matchedCount > 0;
		} else {
			return null;
		}
	} else {
		return null;
	}
}
exports.updateCourseById = updateCourseById;

async function deleteCourseById(id) {
	const db = getDbReference();
	const collection = db.collection('courses');
	const result = await collection.deleteOne({
		_id: new ObjectId(id),
	});
	return result.deletedCount > 0;
}
exports.deleteCourseById = deleteCourseById;

async function getStudentsByCourse(id) {
	const db = getDbReference();
	const collection = db.collection('users');
	const studentsByCourse = await collection
		.aggregate([{ $match: { courseId: id } }])
		.toArray();
	return studentsByCourse;
}
exports.getStudentsByCourse = getStudentsByCourse;

async function getAssignmentsByCourse(id) {
	const db = getDbReference();
	const collection = db.collection('assignments');
	const studentsByCourse = await collection
		.aggregate([{ $match: { courseId: id } }])
		.toArray();
	return studentsByCourse;
}
exports.getAssignmentsByCourse = getAssignmentsByCourse;

async function addStudentsToCourse(id, studentIDs) {
	const db = getDbReference();
	const collection = db.collection('courses');
	await collection.updateOne(
		{ _id: new ObjectId(id) },
		{
			$addToSet: {
				students: {
					$each: studentIDs,
				},
			},
		}
	);
}
exports.addStudentsToCourse = addStudentsToCourse;

async function removeStudentsFromCourse(id, studentIDs) {
	const db = getDbReference();
	const collection = db.collection('courses');
	await collection.updateOne(
		{ _id: new ObjectId(id) },
		{
			$pull: {
				students: {
					$in: studentIDs,
				},
			},
		}
	);
}
exports.removeStudentsFromCourse = removeStudentsFromCourse;
