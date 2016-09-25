var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');
var exphbs	= require('express-handlebars');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./soon.db');

db.serialize(() => {
	db.run(`CREATE TABLE IF NOT EXISTS 'countdown' (
		'id'	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
		'title'	TEXT NOT NULL,
		'description'	TEXT,
		'startTimestamp'	INTEGER,
		'endTimestamp'	INTEGER NOT NULL,
		'createdTimestamp'	INTEGER NOT NULL,
		'deletePassphrase'	TEXT
	)`);

	db.run(`CREATE TABLE IF NOT EXISTS 'hashtag' (
		'id' INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
		'name' TEXT NOT NULL UNIQUE
	)`);

	db.run(`CREATE TABLE IF NOT EXISTS 'hashtagAssociation' (
		'hashtagId'	INTEGER NOT NULL,
		'countdownId'	INTEGER NOT NULL,
		PRIMARY KEY('hashtagId','countdownId'),
		FOREIGN KEY('hashtagId') REFERENCES hashtag(id),
		FOREIGN KEY('countdownId') REFERENCES countdown(id)
	)`);
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

			var values = createHelpers.generateValues(req, res);

			var sql = `INSERT INTO countdown (title, description, startTimestamp, endTimestamp, createdTimestamp, deletePassphrase)
							VALUES ($title, $description, $startTimestamp, $endTimestamp, $createdTimestamp, $deletePassphrase)`;

			var sqlStatement = db.prepare(sql, values, error => {
				if (error != null) {
					console.log(error);
					throw error;
				}
			});

			sqlStatement.run(function(error) {
				if(error != null) {
					console.log(error);
					throw error;
				}

				// TODO: insert hash tags into database
				var hashtagArray = createHelpers.generateHashtagArray(req.body.twitterHashtags);

				res.redirect('/c/'+this.lastID); // redirect to new created countdown
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
	console.log('Example app listening on port 3000!');
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
