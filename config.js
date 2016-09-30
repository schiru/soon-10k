config = {};

config.dirtyTwitterCache = {
	cachingDuration: 10 * 1000
}

config.inputLengthBounds = {
  title: {
    min: 0,
    max: 60
  },
  description: {
    min: 0, max: 300
  },
  hashtags: {
    min: 0,
    max: 60
  },
  dateTime: {
    abs: {
      date: {
        min: 0,
        max: 10
      },
      time: {
        min: 0,
        max: 8
      },
      timezone: {
        min: 0,
        max: 3
      }
    },
    rel: {
        min: 0,
        max: 60
    }
  },
  passphrase: {
    min: 4,
    max: 100,
  }
};

module.exports = config;
