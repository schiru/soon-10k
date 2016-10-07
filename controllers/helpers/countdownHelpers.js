const moment = require('moment');
const countdown = require('countdown');

module.exports.getCountdownDateText = (endTimestamp) => {
	let text = '';
	let cd = countdown(new Date(endTimestamp));

	if (cd.years > 0) {
		text = cd.years + (cd.years != 1 ? ' years' : ' year') + ', ';
	}

	if (cd.months > 0) {
		text += cd.months + (cd.months != 1 ? ' months' : ' month') + ', ';
	}

	if (cd.days > 0) {
		text += cd.days + (cd.days != 1 ? ' days' : ' day') + ', ';
	}

	return text;
}

module.exports.getCountdownTimeText = (endTimestamp) => {
	let fields = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;
	let cdTime = countdown(new Date(), new Date(endTimestamp), fields)

	if (cdTime.days > 0) delete cdTime.seconds;
	delete cdTime.days;

	return cdTime.toString();
}
