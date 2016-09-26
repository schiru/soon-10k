const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const exphbs	= require('express-handlebars');
const sqlite3 = require('sqlite3').verbose();
const SQL_STATEMENTS = require('./sqlStatements');
const createHelpers = require('./createHelpers');
const twitterHelpers = require('./twitterHelpers');

const db = global.db = new sqlite3.Database('./soon.db');

db.serialize(() => {
	SQL_STATEMENTS.init.forEach(statement => {
		db.run(statement);
	});
});

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(compression());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get(['/', 'index'], function (req, res) {
		res.render('index', {
			title: "Soon"
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
				res.redirect(`/c/${countdownId}`);
			}).catch(error => {
				console.error('error in createCountdown chain: ', error);
			});
		} else {
			console.log(errors);
			res.render('create', {'body': req.body, 'errors': errors}); // render create page with current values and errors
		}
	});
});

app.get('/c/:id', function (req, res) {
	let id;
	try {
		id = parseInt(req.params.id);

		if (isNaN(id))
			throw new Error('countdown id malformed');
	} catch(error) {
		console.error(error);
		res.status(400);
		res.end();
		return;
	}

	console.log(`detail view for id ${id} requested...`);
	let selectCountdownStatement = SQL_STATEMENTS.select.countdown;
	let selectHashtagsStatement = SQL_STATEMENTS.select.hashtagsForCountdown;

	db.all(selectCountdownStatement, [id], (error, infos) => {
		if (error || infos.length !== 1) {
			console.log(`could not fetch id ${id}`);
			res.status(404);
			// TODO: Implement 404 page
			res.end('Countdown not found');
			return;
		}

		let info = infos[0];
		let hashtagsArray = [];
		let percentage = null;

		// calculate current downlaod progress percentage
		if (info.startTimestamp) {
			let now = new Date().getTime();
			let end = info.endTimestamp;
			let start = info.startTimestamp;

			let totalDiff = end - start;
			let currentDiff = end - now;
			if (totalDiff > 0 && currentDiff < totalDiff) {
				percentage = 100 - (100*(currentDiff/totalDiff));
				percentage = Math.round(percentage);
			}
		}

		// Fetch associated hashtags
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
						cTitle: info.title,
						cDescription: info.description,
						cEndDate: new Date(info.endTimestamp).toISOString(),
						cHashtags: hashtagsString,
						cPercentage: percentage,
						cPercentageBarValue: percentage/2,
						percentageVisible: percentage != null,
						tweetsVisible: tweetsVisible,
						tweets: tweets
					});
				}

				if (hashtagsArray.length > 0) {
					twitterHelpers.getTweetsForHashtags(hashtagsArray)
						.catch((error) => {
							console.error(error);
						}).then((tweets) => {
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

function cleanup() {
	console.log('Shutting down...');
	db.close();
}

process.on('exit', (code) => {
	cleanup();
	process.exit(code);
});

process.on('SIGINT', (code) => {
	cleanup();
	process.exit(code);
});
