'use strict';

const cluster = require('cluster');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = global.db = new sqlite3.Database('./soon.db');

const bodyParser = require('body-parser');
const compression = require('compression');
const exphbs	= require('express-handlebars');
const moment = require('moment');
const countdown = require('countdown');
require('moment-countdown');
const SQL_STATEMENTS = require('./sqlStatements');
const createHelpers = require('./createHelpers');
const twitterHelpers = require('./twitterHelpers');
const handlebarsHelpers = require('./handlebarsHelpers');

if (cluster.isMaster) {

	db.serialize(() => {
		SQL_STATEMENTS.init.forEach(statement => {
			db.run(statement);
		});
	});

  // Fork a single worker.
  // sqlite does not support more than one worker.
  cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
		// restart worker on crash.
		console.log('worker %d died (%s). restarting...',
    						worker.process.pid, signal || code);
	  cluster.fork();
  });

} else {
	// worker

	var app = express();

	app.engine('handlebars', exphbs({defaultLayout: 'main', helpers: handlebarsHelpers}));
	app.set('view engine', 'handlebars');

	app.use(compression());
	app.use(express.static('public'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	app.get(['/', 'index'], function (req, res) {

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

	});

	app.get('/create', function (req, res) {
			res.render('create', {
				title: "Create Countdown - Soon"
			});
	});

	app.post('/create', function(req, res) {
		createHelpers.validateInput(req, res, function(isValid, errors) {
			if (isValid) {
				let values = createHelpers.generateValues(req, res);
				let hashtagsArray = createHelpers.generateHashtagArray(req.body.twitterHashtags);

				createHelpers.createCountdown(values, hashtagsArray).then(countdownId => {
					console.log('countdown created');

					//TODO: restructure create process
					let selectCountdownStatement = SQL_STATEMENTS.select.countdown;
					db.get(selectCountdownStatement, [countdownId], (error, row) => {
						//TODO: error handling
						res.redirect(`/c/${row.uuid}`);
					});

				}).catch(error => {
					console.error('error in createCountdown chain: ', error);
				});
			} else {
				let cdIsRel = (req.body.cdType == 'rel') ? true : false;
				res.render('create', {'body': req.body, 'cdIsRel': cdIsRel, 'errors': errors}); // render create page with current values and errors
			}
		});
	});

	app.get('/c/:uuid', function (req, res) {
		let uuid = req.params.uuid;

		console.log(`detail view for uuid ${uuid} requested...`);
		let selectCountdownStatement = SQL_STATEMENTS.select.countdownByUUID;
		let selectHashtagsStatement = SQL_STATEMENTS.select.hashtagsForCountdown;

		db.all(selectCountdownStatement, [uuid], (error, infos) => {
			if (error || infos.length !== 1) {
				console.log(`could not fetch uuid ${uuid}`);
				res.status(404);
				// TODO: Implement 404 page
				res.end('Countdown not found');
				return;
			}

			let now = new Date().getTime();
			let info = infos[0];
			let end = info.endTimestamp;
			let isRelativeCountdown = info.startTimestamp != null;
			let hashtagsArray = [];
			let percentage = null;

			let remainingSeconds = (info.endTimestamp - now) / 1000;
			remainingSeconds = Math.ceil(remainingSeconds);
			remainingSeconds = remainingSeconds < 0 ? 0 : remainingSeconds;

			// calculate current downlaod progress percentage
			if (isRelativeCountdown) {
				let start = info.startTimestamp;

				let totalDiff = end - start;
				let currentDiff = end - now;
				if (totalDiff > 0 && currentDiff < totalDiff) {
					percentage = 100 - (100*(currentDiff/totalDiff));
					percentage = Math.round(percentage);
					percentage = percentage > 100 ? 100 : percentage;
				}
			}

			let countdown = moment().countdown(end).toString();
			let endDate = moment(end).format('dddd, MMMM Do YYYY, h:mm:ss a') + ' (UTC)';

			// Fetch associated hashtags
			let id = info.id;
			db.each(selectHashtagsStatement, [id], (error, hashtag) => {
				if (error) {
					throw error;
				}

				hashtagsArray.push(`#${hashtag.name}`);
				}, () => {
					let render = (tweets) => {
						console.log('rendering details view');
						debugger;
						let hashtagsString = hashtagsArray.join(' ');
						let tweetsVisible = tweets && tweets.length > 0;

						res.render('detail', {
							title: `${info.title} - Soon`,
							cTitle: info.title,
							cDescription: info.description,
							cEndDate: endDate,
							cHashtags: hashtagsString,
							cPercentage: percentage,
							cPercentageBarValue: percentage/2,
							cCountdown: countdown,
							percentageVisible: percentage != null,
							remainingSeconds: remainingSeconds,
							tweetsVisible: tweetsVisible,
							tweets: tweets,
							isRelativeCountdown: isRelativeCountdown,
							metaRefresh: {
								delay: 30, //in seconds
								url: `/c/${info.uuid}`
							}
						});
					}

					if (hashtagsArray.length > 0) {
						twitterHelpers.getTweetsForHashtags(hashtagsArray)
							.catch((error) => {
								console.error(error);
							}).then((tweets) => {
								let statuses = tweets.statuses;
								twitterHelpers.patchStatuses(statuses);
								debugger;
								return render(tweets.statuses);
							});
					} else {
						render();
					}
			});
		});
	});

	app.listen(3000, function () {
		console.log('Soon is available on port 3000!');
	});
	//
	// function cleanup() {
	// 	console.log('Shutting down...');
	// 	db.close();
	// }
	//
	// process.on('exit', (code) => {
	// 	cleanup();
	// 	process.exit(code);
	// });
	//
	// process.on('SIGINT', (code) => {
	// 	cleanup();
	// 	process.exit(code);
	// });
}
