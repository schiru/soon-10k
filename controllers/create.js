const SQL_STATEMENTS = require('../sqlStatements');

const moment = require('moment');
const countdown = require('countdown');

const createHelpers = require('./helpers/createHelpers');

module.exports.get = (req, res) => {
		res.render('create', {
			title: "Create Countdown - Soon"
		});
};

module.exports.post = (req, res) => {
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
}
