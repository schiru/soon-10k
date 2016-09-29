const moment = require('moment');
const countdown = require('countdown');
const helpers = {};

helpers.timeFromNow = function(timestamp) {
  if (timestamp > moment.now().valueOf()) {
    return 'ending '+moment(parseInt(timestamp)).fromNow();
  } else {
    return 'ended '+moment(parseInt(timestamp)).fromNow();
  }
}

helpers.percentage = function(startTimestamp, endTimestamp) {
  let percentage = 0;
  let totalDiff = parseInt(endTimestamp) - parseInt(startTimestamp);
  let currentDiff = parseInt(endTimestamp) - moment.now().valueOf();
  if (totalDiff > 0 && currentDiff < totalDiff) {
    percentage = 100 - (100*(currentDiff/totalDiff));
    percentage = Math.round(percentage);
    percentage = percentage > 100 ? 100 : percentage;
  }

  return percentage;
}

helpers.barAnimationPercentage = function(startTimestamp, endTimestamp) {
  return helpers.percentage(startTimestamp, endTimestamp)/2;
}

helpers.barAnimationSeconds = function(endTimestamp) {
  let animationSeconds = (parseInt(endTimestamp) - moment.now().valueOf()) / 1000;
  animationSeconds = Math.ceil(animationSeconds);
  animationSeconds = animationSeconds < 0 ? 0 : animationSeconds;

  return animationSeconds;
}

module.exports = helpers;
