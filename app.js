'use strict';

const cluster = require('cluster');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = global.db = new sqlite3.Database('./soon.db');
const SQL_STATEMENTS = require('./sqlStatements');

const bodyParser = require('body-parser');
const compression = require('compression');
const exphbs	= require('express-handlebars');
const moment = require('moment');
const countdown = require('countdown');

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

	app.use(require('./routes'));

	app.listen(3000, function () {
		console.log('Soon is available on port 3000!');
	});
}
