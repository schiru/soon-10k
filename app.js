const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const exphbs	= require('express-handlebars');
const sqlite3 = require('sqlite3').verbose();
const SQL_STATEMENTS = require('./sqlStatements');

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
	var createHelpers = require('./createHelpers');

	createHelpers.validateInput(req, res, function(isValid, errors) {
		if (isValid) {
			let values = createHelpers.generateValues(req, res);
			let hashtagsArray = createHelpers.generateHashtagArray(req.body.twitterHashtags);

			createHelpers.createCountdown(values, hashtagsArray).then(insertedId => {
				console.log('countdown created');
				res.redirect(`/c/${id}`);
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
		if (req.params.id && !isNaN(id = parseInt(req.params.id))) {
			console.log(`detail view for id ${id} requested...`);

			db.all(`SELECT cd.id, cd.title, cd.description, cd.endTimestamp
				FROM countdown cd
				WHERE cd.id = ?`, [id], (err, infos) => {

					if (!err && infos.length === 1) {
						let info = infos[0];
						let hashtags = [];

						db.each(`SELECT ht.name
							FROM hashtagAssociation hA
							JOIN hashtag ht ON hA.hashtagId = ht.id
							WHERE hA.countdownId = ?`, [id], (err, hashtag) => {

								if (!err) {
									console.log(hashtag);
									hashtags.push(hashtag.name);
								} else
									throw err;

							}, () => {
								console.log('import done', info);
								res.render('detail', {
									cTitle: info.title,
									cDescription: info.description
								});
							});
					} else {
						throw err;
					}
				});
		} else {
			res.status(400);
			res.end();
		};
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
