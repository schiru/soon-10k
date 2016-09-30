const SQL_STATEMENTS = require('../sqlStatements');

const moment = require('moment');
const countdown = require('countdown');

const twitterHelpers = require('./helpers/twitterHelpers');

module.exports.get = (req, res) => {
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

		let currentDiff = end - now;

		let isRelativeCountdown = info.startTimestamp != null;
		let hashtagsArray = [];
		let percentage = null;

		let animationSeconds = (info.endTimestamp - info.startTimestamp) / 1000;
		animationSeconds = Math.floor(animationSeconds);
		animationSeconds = animationSeconds < 0 ? 0 : animationSeconds;

		// calculate current downlaod progress percentage
		if (isRelativeCountdown) {
			let start = info.startTimestamp;
			let totalDiff = end - start;
			if (totalDiff > 0 && currentDiff < totalDiff) {
				percentage = 100 - (100*(currentDiff/totalDiff));
				percentage = Math.floor(percentage);
				percentage = percentage > 100 ? 100 : percentage;
			}
		}

		let cd = countdown(new Date(end));
		console.log('countdown:', cd.toString());

		let countdownDateText = '';
		let countdownTimeText = '';
		if (currentDiff > 0) {
			debugger;
			if (cd.years > 0) {
				countdownDateText = cd.years + (cd.years != 1 ? ' years' : ' year') + ', ';
			}

			if (cd.months > 0) {
				countdownDateText += cd.months + (cd.months != 1 ? ' months' : ' month') + ', ';
			}

			if (cd.days > 0) {
				countdownDateText += cd.days + (cd.days != 1 ? ' days' : ' days') + ', ';
			}

			let fields = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

			let cdTime = countdown(new Date(), new Date(end), fields)
			if (cdTime.days > 0) delete cdTime.seconds;
			delete cdTime.days;
			countdownTimeText = cdTime.toString() + ' left';
		}
		else {
			countdownDateText = 'Countdown ended';
		}
		let endDate = moment.utc(end).format('dddd, MMMM Do YYYY, h:mm:ss a') + ' (UTC)';

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
					let tweetsVisible = tweets instanceof Array;
					let noTweetsWarningVisible = tweetsVisible && tweets.length == 0;

					res.render('detail', {
						title: `${info.title} - Soon`,
						cTitle: info.title,
						cDescription: info.description,
						cEndDate: endDate,
						cHashtags: hashtagsString,
						cPercentage: percentage,
						cPercentageBarValue: percentage/2,
						cCountdownDate: countdownDateText,
						cCountdownTime: countdownTimeText,
						percentageVisible: percentage != null,
						animationSeconds: animationSeconds,
						tweetsVisible: tweetsVisible,
						noTweetsWarningVisible: noTweetsWarningVisible,
						tweets: tweets,
						isRelativeCountdown: isRelativeCountdown,
						metaRefresh: {
							delay: 30, //in seconds
							url: `/c/${info.uuid}`
						},
						jsCEndTime: info.endTimestamp
					});
				}

				if (hashtagsArray.length > 0) {
					twitterHelpers.getTweetsForHashtags(hashtagsArray)
						.catch((error) => {
							console.error(error);
							return render([]);
						}).then((tweets) => {
							let statuses = tweets.statuses;
							twitterHelpers.patchStatuses(statuses);
							return render(tweets.statuses);
						});
				} else {
					render();
				}
		});
	});
};
