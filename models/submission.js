const SubmissionSchema = {
	assignmentID: { required: true },
	studentID: { required: true },
	timestamp: { required: true },
	grade: { required: true },
	file: { required: true },
};
exports.SubmissionSchema = SubmissionSchema;
