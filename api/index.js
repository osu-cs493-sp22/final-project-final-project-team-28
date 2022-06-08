const { Router } = require('express');

const router = Router();

router.use('/users', require('./users'));
router.use('/assignments', require('./assignments.js'));
router.use('/courses', require('./courses.js'));
router.use('/submissions', require('./submissions.js'));


const { getSubmissionDownloadStream } = require('../models/submission');

router.get('/media/submissions/:filename',  function (req, res, next) {
    getSubmissionDownloadStream(req.params.filename)
      .on('file', function (file) {
        res.status(200).type(file.metadata.mimetype)
      })
      .on('error', function (err) {
        if(err.code === 'ENOENT'){
          next();
        } else {
          next(err);
        }
      })
    .pipe(res)
})
  

module.exports = router;

