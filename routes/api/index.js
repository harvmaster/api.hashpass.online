var router = require('express').Router();

router.use('/', require('./users'));
router.use('/services', require('./services'));
router.use('/uploads', require('./uploads'));

module.exports = router;
