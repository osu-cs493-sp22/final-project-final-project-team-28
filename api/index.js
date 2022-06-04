const { Router } = require('express')

const router = Router()

router.use('/users', require('./users'))
// router.use('/photos', require('./photos'))

module.exports = router
