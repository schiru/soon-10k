const SQL_STATEMENTS = require('./sqlStatements');
const sqlite3 = require('sqlite3').verbose();
const db = global.db;

module.exports.createCountdown = function(values, hashtagsArray) {
	let statement = SQL_STATEMENTS.insert.createCountdown;

	return executeInsertStatement(statement, values).then(createdCountdownId => {
		console.log('countdown created, id: ' + createdCountdownId);
		let promises = [];
		hashtagsArray.forEach(hashtag => {
			promises.push(createHashtag(hashtag).then(createdHashtagId => {
				return associateHashtagAndCountdown(createdHashtagId, createdCountdownId);
			}));
		});

		return Promise.all(promises).then(() => {
			return createdCountdownId;
		})
	});
}

function createHashtag(title) {
	console.log('creating hashtag..')
	let statement = SQL_STATEMENTS.insert.createHashtag;
 	return executeInsertStatement(statement, [title]).catch(error => {
		// TODO: if error, check if hashtag does already exist
		// if so, fetch id and return it
	});
};

function associateHashtagAndCountdown(hashtagId, countdownId) {
	let statement = SQL_STATEMENTS.insert.createHashtagAssociation;
	let values = [hashtagId, countdownId];
 	return executeInsertStatement(statement, values);
}

function executeInsertStatement(statement, values) {
	console.log('executing sql statement');
	let promise = new Promise((resolve, reject) => {
		let preparedStatement = db.prepare(statement);
		preparedStatement.bind(values, error => {
			if (error != null) {
				console.error(error);
				throw error;
			}

			console.log('running prepared statement');
			preparedStatement.run(function(error) {
				if (error != null) {
					console.error(error);
					throw error;
				}

				resolve(this.lastID);
			});
		});
	});

	return promise;
}

module.exports.validateInput = function (req, res, callback) {
	var values = req.body;
	var errors = [];
	var isValid = true;

	// validate title
	if (values.title == '') {
		isValid = false;
		errors.push('A title is reqired.');
	}

	// validate time input
	if (values.cdType == 'abs') {

		if (values.abs_date == '') {
			isValid = false;
			errors.push('A date is reqired.');
		} else {
			var date = generateAbsDateObject(values.abs_date, values.abs_time);
			if (isNaN(date.valueOf())) {
				isValid = false;
				errors.push('The entered date is invalid.');
			}
		}

	} else if (values.cdType == 'rel') {

		if (values.days == '' && values.hours == '' && values.minutes == '' && values.seconds == '') {
			isValid = false;
			errors.push('A duration is reqired.');
		} else {
			var date = generateRelDateObject(values.days, values.hours, values.minutes, values.seconds);
			if (isNaN(date.valueOf())) {
				isValid = false;
				errors.push('The duration is invalid.');
			}
		}

	} else {
		isValid = false;
		errors.push('No valid input!');
	}

	callback(isValid, errors);

};

var generateAbsDateObject = function (dateString, timeString) {
	var dateTimeString = dateString;
	if (timeString != '') {
		dateTimeString += 'T'+timeString;
	}

	return new Date(dateTimeString);
}

var generateRelDateObject = function (daysString, hoursString, minutesString, secondsString) {
	var durationSeconds = (parseInt(secondsString))
											+ (parseInt(minutesString)*60)
											+ (parseInt(hoursString)*60*60)
											+ (parseInt(daysString)*24*60*60);

	var duration = durationSeconds*1000;
	var now = new Date().getTime();
	return new Date(now+duration);
}

module.exports.generateValues = function (req, res) {

	var endDate;
	if (req.body.cdType == 'abs') {
		endDate = generateAbsDateObject(req.body.abs_date, req.body.abs_time);
	} else if (req.body.cdType == 'rel') {
		endDate = generateRelDateObject(req.body.days, req.body.hours, req.body.minutes, req.body.seconds);
	}

	var start = created = new Date().getTime();
	var end = endDate.getTime();

	var values = {
		'$title': req.body.title,
		'$description': req.body.description,
		'$startTimestamp': start,
		'$endTimestamp': end,
		'$createdTimestamp': created,
		'$deletePassphrase': 'DELETE'
	}

	return values;
};

/**
 * Splits a string into an array of hashtags without '#'.
 * The string will be split by '#' and ' '.
 *
 * @param  {string} hashtagString input string
 * @return {array}
 */
module.exports.generateHashtagArray = function(hashtagString) {
	var splitByHash = hashtagString.split('#');
	var hashtagArray = [];

	for (var i = 0; i < splitByHash.length; i++) {
		var splitBySpace = splitByHash[i].split(' ');

		for (var j = 0; j < splitBySpace.length; j++) {
			if (splitBySpace[j] != '') {
				hashtagArray.push(splitBySpace[j]);
			}
		}
	}

	return hashtagArray;
}
