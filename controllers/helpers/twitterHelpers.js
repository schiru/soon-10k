const Twitter = require('twitter');
const moment = require('moment');
const KEYS = require.main.require('./keys');
const dbHelpers = require('./dbHelpers');
const SQL_STATEMENTS = require.main.require('./sqlStatements');
const config = require.main.require('./config.js');

const twitterClient = new Twitter({
  consumer_key: KEYS.twitter.consumer_key,
  consumer_secret: KEYS.twitter.consumer_secret,
  access_token_key: KEYS.twitter.access_token_key,
  access_token_secret: KEYS.twitter.access_token_secret
});

let helpers = {}

helpers.getTweetsForCountdown = function(countdownId, hashtagsArray) {
	let selectStatement = SQL_STATEMENTS.select.twitterCacheByCountdown;
	let cacheExists = false;
	let cacheExpired = false;
	let cacheObj = null;
	let now = new Date().getTime();

	return dbHelpers.queryAll(selectStatement, countdownId).then(rows => {
		if (rows instanceof Array && rows.length == 1) {
			cacheExists = true;
			cacheObj = rows[0];

			cacheObj.cache = JSON.parse(cacheObj.cache);

			if (now > cacheObj.expires) {
				cacheExpired = true;
			}
		}

		if (cacheExists) {
			if (cacheExpired) {
				helpers.getTweetsForHashtags(hashtagsArray).then((tweets, response) => {
					return helpers.cacheTweets(cacheExists, tweets, countdownId);
				});
			}

			return cacheObj.cache;
		} else {
			let fetchTweets = helpers.getTweetsForHashtags(hashtagsArray);
			let fetchedTweets = null;
			return fetchTweets.then((tweets, response) => {
				fetchedTweets = tweets;
				return helpers.cacheTweets(cacheExists, tweets, countdownId)
			}).then(() => {
				return fetchedTweets;
			});
		}
	});
};

helpers.cacheTweets = function(cacheExists, tweets, countdownId) {
	let sqlStatement = "";
	if (cacheExists) {
		sqlStatement = SQL_STATEMENTS.update.dirtyTwitterCache;
	} else {
		sqlStatement = SQL_STATEMENTS.insert.dirtyTwitterCache;
	}

	debugger;
	let newExpiry = (new Date().getTime()) + config.dirtyTwitterCache.cachingDuration;
	let jsonTweets = JSON.stringify(tweets);
	let values = {
		$expires: newExpiry,
		$tweets: jsonTweets,
		$countdownId: countdownId
	}

	return dbHelpers.runStatement(sqlStatement, values);
}

helpers.getTweetsForHashtags = function(hashtagsArray) {
	let hashtagsQuery = hashtagsArray.join(' OR ') + ' lang:en';
	console.log('requesting tweets for hashtags ' + hashtagsQuery);
	return new Promise((resolve, reject) => {
		twitterClient.get('search/tweets', {q: hashtagsQuery, count: 9}, function(error, tweets, response) {
		   if (error) {
				 reject(error);
				 return null;
			 }

			 console.log('tweets received');
			 resolve(tweets, response);
		});
	})
};

helpers.patchStatuses = function(twitterStatuses) {
	if (!(twitterStatuses instanceof Array) || twitterStatuses.length == 0) {
		return [];
	}

	twitterStatuses.forEach(status => {
		status.created_at_relative = moment(new Date(status.created_at)).fromNow();
	});
};

module.exports = helpers;
