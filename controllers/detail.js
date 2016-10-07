const SQL_STATEMENTS = require('../sqlStatements');

const moment = require('moment');
const countdown = require('countdown');

const twitterHelpers = require('./helpers/twitterHelpers');
const countdownHelpers = require('./helpers/countdownHelpers');

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

		let countdownDateText = '';
		let countdownTimeText = '';
		let endDate = moment.utc(end).format('dddd, MMMM Do YYYY, h:mm:ss a') + ' (UTC)';

		if (currentDiff > 0) {
			countdownDateText = countdownHelpers.getCountdownDateText(end);
			countdownTimeText = countdownHelpers.getCountdownTimeText(end) + ' left';
		}
		else {
			countdownDateText = 'Countdown ended';
		}

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
						countdown: info,
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
					twitterHelpers.getTweetsForCountdown(id, hashtagsArray).catch((error) => {
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
