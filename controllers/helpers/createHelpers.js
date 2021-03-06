'use strict';

const config = require.main.require('./config');
const passwordHash = require('password-hash');
const uuid = require('uuid');

const SQL_STATEMENTS = require.main.require('./sqlStatements');
const db = global.db;
const dbHelpers = require('./dbHelpers');

module.exports.createCountdown = function(values, hashtagsArray) {
	let statement = SQL_STATEMENTS.insert.createCountdown;

	return dbHelpers.runStatement(statement, values).then(createdCountdownId => {
		console.log('countdown created, id: ' + createdCountdownId);
		return associateHashtagsWithCountdown(hashtagsArray, createdCountdownId).then(() => {
			return createdCountdownId;
		});
	});
}

function createHashtag(title) {
	console.log('creating hashtag..');
	let statement = SQL_STATEMENTS.insert.createHashtag;

 	return dbHelpers.runStatement(statement, [title]);
};

function getHashtagId(title) {
	let statement = SQL_STATEMENTS.select.hashtagByName;

	return dbHelpers.queryAll(statement, title).then(rows => {
		debugger;
		if (rows instanceof Array && rows.length == 1) {
			return rows[0].id;
		} else {
			return null;
		}
	}).then(id => {
		if (id != null && typeof id == "number")
			return id;
		else
			return null;
	});
}

function associateHashtagsWithCountdown(hashtagsArray, countdownId) {
	let statement = SQL_STATEMENTS.insert.createHashtagAssociation;
	let promises = [];

	hashtagsArray.forEach(hashtag => {
		promises.push(getHashtagId(hashtag).then(id => {
			debugger;
			if (id == null) {
				return createHashtag(hashtag);
			}

			return id;
		}).then(hashtagId => {
			return dbHelpers.runStatement(statement, [hashtagId, countdownId]);
		}).catch(error => {
			if (error.code != 'SQLITE_CONSTRAINT')
				return error;
		}));
	});

	return Promise.all(promises)
}

/**
 * Examines if a input value or any input value in a given array is not empty.
 * Pushes the errorMessage if necessary to the errorsArray and returns the resulting boolen value.
 *
 * @param  {String | String[]} values
 * @param  {String} errorMessage
 * @param  {String[]} errorsArray
 * @return {Boolean}
 */
function validationValueRequired(values, errorMessage, errorsArray) {
	let isValid = true;
	if (Array.isArray(values)) {
		// determine if one of the n values was given
		let oneInN = false;
		for (let val of values) {
			if (val != '' && val != null) {
				oneInN = true;
			}
		}
		if (!oneInN) {
			isValid = validationError(errorMessage, errorsArray);
		}

	} else if (values == '' || values == null) {
		isValid = validationError(errorMessage, errorsArray);
	}

	return isValid;
}

function validateValueLength(value, range, errorMessage, errorsArray) {
	if (value.length < range.min || value.length > range.max) {
		return validationError(errorMessage, errorsArray);
	} else {
		return true;
	}
}

/**
 * Pushes a errorMessage to the errorsArray and returns false.
 *
 * @param  {String} errorMessage
 * @param  {String[]} errorsArray
 * @return {boolean}              allways false
 */
function validationError(errorMessage, errorsArray) {
	errorsArray.push(errorMessage);
	return false;
}

/**
 * Validates the create input from the client form.
 * Calls the given vallback with the isValid flag and the errorsArray.
 *
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} callback
 * @return {void}
 */
module.exports.validateInput = function (req, res, callback) {
	var values = req.body;
	var errors = [];
	var isValid = true;
	var ilb = config.inputLengthBounds;

	// validate title
	let titleValid = true;
	titleValid = validationValueRequired(values.title, 'A title is required.', errors);
	titleValid = titleValid && validateValueLength(values.title, ilb.title, `The title is too long. (max ${ilb.title.max} characters)`, errors);

	// validate description
	let descValid = validateValueLength(values.description, ilb.description, `The discription is too long. (max ${ilb.description.max} characters)`, errors);

	// validate hashtags
	let hashValid = validateValueLength(values.twitterHashtags, ilb.hashtags, `Too many hashtags. (max ${ilb.hashtags.max} characters)`, errors);

	// validate time input
	let dateValid = true;
	if (values.cdType == 'abs') {

		dateValid = validationValueRequired(values.abs_date, 'A date is required.', errors)
								&& validationValueRequired(values.abs_offset, 'A timezone is required.', errors);

		dateValid = dateValid && validateValueLength(values.abs_date, ilb.dateTime.abs.date, 'The date is invalid.', errors);
		dateValid = dateValid && validateValueLength(values.abs_time, ilb.dateTime.abs.time, 'The date is invalid.', errors);
		dateValid = dateValid && validateValueLength(values.abs_offset, ilb.dateTime.abs.timezone, 'The date is invalid.', errors);

		if (dateValid) { // date was entered
			var date = generateAbsDateObject(values.abs_date, values.abs_time, values.abs_offset);
			if (isNaN(date.valueOf())) { // check if entered date was valid
				dateValid = validationError('The date is invalid.', errors);
			}
		}

	} else if (values.cdType == 'rel') {

		dateValid = validationValueRequired([values.days, values.hours, values.minutes, values.seconds], 'A duration is required.', errors);

		dateValid = dateValid && validateValueLength(values.days, ilb.dateTime.rel, 'The duration is invalid.', errors);
		dateValid = dateValid && validateValueLength(values.hours, ilb.dateTime.rel, 'The duration is invalid.', errors);
		dateValid = dateValid && validateValueLength(values.minutes, ilb.dateTime.rel, 'The duration is invalid.', errors);
		dateValid = dateValid && validateValueLength(values.seconds, ilb.dateTime.rel, 'The duration is invalid.', errors);

		if (dateValid) { // date was entered
			var date = generateRelDateObject(values.days, values.hours, values.minutes, values.seconds);
			if (isNaN(date.valueOf())) { // check if entered duration was valid
				dateValid = validationError('The duration is invalid.', errors);
			}
		}

	} else {
		dateValid = validationError('No valid date or duration input.', errors);
	}

	/* DELETE PROCESS CURRENTLY NOT IMPLEMENTED
	// validate passphrase
	let passValid = true;
	passValid = validationValueRequired(values.delpass, 'A delete passphrase is required.', errors);
	passValid = passValid && validateValueLength(values.delpass, ilb.passphrase, `The delete passphrase is too long. (max ${ilb.passphrase.max} characters)`, errors);
	if(passValid && values.delpass.length < ilb.passphrase.min) {
		passValid = validationError(`Passphrase must be at least ${minPassLen} characters.`, errors);
	}
	*/

	isValid = titleValid && hashValid && descValid && dateValid;
	callback(isValid, errors);
};

/**
 * Generates the target date opject from the client form values for the date input.
 *
 * @param  {String} dateString           YYYY-MM-DD string is expected
 * @param  {String} timeString           HH:MM:SS string is expected
 * @param  {String} timezoneOffsetString number as string (e.g. 2 or -2) is expected
 * @return {Date}
 */
var generateAbsDateObject = function (dateString, timeString, timezoneOffsetString) {
	var dateTimeString = dateString;
	if (timeString != '') {
		dateTimeString += 'T'+timeString;
	}

	var timezoneOffset = parseInt(timezoneOffsetString)*60*60*1000;
	var targetDateTimestamp = new Date(dateTimeString).getTime() - timezoneOffset;

	return new Date(targetDateTimestamp);
}

/**
 * Generates the target date opject from the client form values for the duration input.
 * A negative duration will result in an invalid date.
 *
 * @param  {String} daysString     number as string is expected
 * @param  {String} hoursString    number as string is expected
 * @param  {String} minutesString  number as string is expected
 * @param  {String} secondsString  number as string is expected
 * @return {Date}
 */
var generateRelDateObject = function (daysString, hoursString, minutesString, secondsString) {
	var durationSeconds = (parseInt(secondsString) | 0)
											+ (parseInt(minutesString)*60 | 0)
											+ (parseInt(hoursString)*60*60 | 0)
											+ (parseInt(daysString)*24*60*60 | 0);

	if (durationSeconds <= 0) {
		return new Date(NaN); // produce invalid date
	}
	var duration = durationSeconds*1000;
	var now = new Date().getTime();

	return new Date(now+duration);
}

/**
 * Prepares the values from the input form for the database insert.
 *
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
module.exports.generateValues = function (req, res) {

	var endDate;
	if (req.body.cdType == 'abs') {
		endDate = generateAbsDateObject(req.body.abs_date, req.body.abs_time, req.body.abs_offset);
	} else if (req.body.cdType == 'rel') {
		endDate = generateRelDateObject(req.body.days, req.body.hours, req.body.minutes, req.body.seconds);
	}

	// TODO: use created timestamp from client if available (for better accuracy)
	var start, created;
	start = created = new Date().getTime();
	var end = endDate.getTime();

	var values = {
		'$uuid': uuid.v4(),
		'$title': req.body.title,
		'$description': req.body.description,
		'$startTimestamp': start,
		'$endTimestamp': end,
		'$createdTimestamp': created,
		'$deletePassphrase': passwordHash.generate('DELETE PASSPHRASE') // DELETE PROCESS CURRENTLY NOT IMPLEMENTED
	}

	return values;
};

/**
 * Splits a string into an array of hashtags without '#'.
 * The string will be split by '#' and ' '.
 *
 * @param  {String} hashtagString input string
 * @return {Array}
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
