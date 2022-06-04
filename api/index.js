const { Router } = require('express')

const router = Router()

router.use('/users', require('./users'))
router.use('/assignments', require('./assignments.js'))
router.use('/courses', require('./courses.js'))

module.exports = router


