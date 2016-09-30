const express = require('express');
const router = express.Router();

const controllers = {
	index: require('./controllers/index'),
	create: require('./controllers/create'),
	detail: require('./controllers/detail')
};

router.get(['/', 'index'], controllers.index.get);

router.get('/create', controllers.create.get);
router.post('/create', controllers.create.post);

router.get('/c/:uuid', controllers.detail.get);

module.exports = router;
