const SQL_STATEMENTS = require('../sqlStatements');

const moment = require('moment');
const countdown = require('countdown');
const dbHelpers = require('./helpers/dbHelpers');

module.exports.get = (req, res) => {
	let renderContext = {
		title: "Soon"
	};

	dbHelpers.queryAll(SQL_STATEMENTS.select.endingCountdowns).then((rows) => {
		renderContext.ending = rows;
		return dbHelpers.queryAll(SQL_STATEMENTS.select.featuredCountdowns);
	}).then((rows) => {
		renderContext.featured = rows;
		return dbHelpers.queryAll(SQL_STATEMENTS.select.recentCountdowns);
	}).then((rows) => {
		renderContext.recent = rows;
		res.render('index', renderContext); // render index
	}).catch((err) => {
		console.log(err);
		res.status(500);
		res.end("Internal Server Error!");
	});
};
