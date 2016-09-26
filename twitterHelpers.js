const Twitter = require('twitter');
const KEYS = require('./keys');

const twitterClient = new Twitter({
  consumer_key: KEYS.twitter.consumer_key,
  consumer_secret: KEYS.twitter.consumer_secret,
  access_token_key: KEYS.twitter.access_token_key,
  access_token_secret: KEYS.twitter.access_token_secret
});

module.exports.getTweetsForHashtags = function(hashtagsArray) {
	let hashtagsQuery = hashtagsArray.join(' OR ');
	console.log('requesting tweets for hashtags ' + hashtagsQuery);
	return new Promise((resolve, reject) => {
		twitterClient.get('search/tweets', {q: hashtagsQuery}, function(error, tweets, response) {
		   if (error) {
				 reject(error);
				 return null;
			 }

			 console.log('tweets received');
			 resolve(tweets, response);
		});
	})

}
