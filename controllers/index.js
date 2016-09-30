const SQL_STATEMENTS = require('../sqlStatements');

const moment = require('moment');
const countdown = require('countdown');

module.exports.get = (req, res) => {
	//TODO: move function to other location/file
	let queryAllPromise = function(sqlStatement) {
		return new Promise((resolve, reject) => {
			db.all(sqlStatement, (error, rows) => {
				if (error) {
					reject(error);
				} else {
					resolve(rows);
				}
			});
		});
	};

	let renderContext = {
		title: "Soon"
	};

	queryAllPromise(SQL_STATEMENTS.select.endingCountdowns).then((rows) => {
		renderContext.ending = rows;
		return queryAllPromise(SQL_STATEMENTS.select.featuredCountdowns);
	}).then((rows) => {
		renderContext.featured = rows;
		return queryAllPromise(SQL_STATEMENTS.select.recentCountdowns);
	}).then((rows) => {
		renderContext.recent = rows;
		res.render('index', renderContext); // render index
	}).catch((err) => {
		console.log(err);
		res.end("Internal Server Error!");
	});
};
