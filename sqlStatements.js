module.exports = {
	init: [
		`CREATE TABLE IF NOT EXISTS 'countdown' (
			'id'	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
			'uuid' TEXT NOT NULL UNIQUE,
			'title'	TEXT NOT NULL,
			'description'	TEXT,
			'startTimestamp'	INTEGER,
			'endTimestamp'	INTEGER NOT NULL,
			'createdTimestamp'	INTEGER NOT NULL,
			'deletePassphrase'	TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS 'hashtag' (
			'id' INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
			'name' TEXT NOT NULL UNIQUE
		)`,
		`CREATE TABLE IF NOT EXISTS 'hashtagAssociation' (
			'hashtagId'	INTEGER NOT NULL,
			'countdownId'	INTEGER NOT NULL,
			PRIMARY KEY('hashtagId','countdownId'),
			FOREIGN KEY('hashtagId') REFERENCES hashtag(id),
			FOREIGN KEY('countdownId') REFERENCES countdown(id)
		) WITHOUT ROWID;`,
		`CREATE TABLE IF NOT EXISTS 'dirtyTwitterCache' (
			'countdownId'	INTEGER,
			'cache'	TEXT,
			'expires'	INTEGER NOT NULL,
			PRIMARY KEY('countdownId')
		) WITHOUT ROWID;`
	],
	insert: {
		createCountdown: `INSERT INTO countdown (uuid, title, description, startTimestamp, endTimestamp, createdTimestamp, deletePassphrase)
						VALUES ($uuid, $title, $description, $startTimestamp, $endTimestamp, $createdTimestamp, $deletePassphrase)`,
		createHashtag: `INSERT INTO hashtag ('name') VALUES (?);`,
		createHashtagAssociation: `INSERT INTO hashtagAssociation (hashtagId, countdownId) VALUES(?, ?)`,
		dirtyTwitterCache: `INSERT INTO 'dirtyTwitterCache' ('countdownId','cache','expires') VALUES ($countdownId, $tweets, $expires)`
	},
	update: {
		dirtyTwitterCache: `UPDATE 'dirtyTwitterCache' SET 'cache'=($tweets), 'expires'=($expires) WHERE countdownId=($countdownId)`
	},
	select: {
		countdown: `SELECT cd.id, cd.uuid, cd.title, cd.description, cd.startTimestamp, cd.endTimestamp
			FROM countdown cd
			WHERE cd.id = ?`,
		countdownByUUID: `SELECT cd.id, cd.uuid, cd.title, cd.description, cd.startTimestamp, cd.endTimestamp
			FROM countdown cd
			WHERE cd.uuid = ?`,
		hashtagsForCountdown: `SELECT ht.name
			FROM hashtagAssociation hA
			JOIN hashtag ht ON hA.hashtagId = ht.id
			WHERE hA.countdownId = ?`,
		recentCountdowns: `SELECT cd.id, cd.uuid, cd.title, cd.description, cd.startTimestamp, cd.endTimestamp
			FROM countdown cd
			ORDER BY cd.createdTimestamp DESC
			LIMIT 5`,
		endingCountdowns: `SELECT cd.id, cd.uuid, cd.title, cd.description, cd.startTimestamp, cd.endTimestamp
			FROM countdown cd
			WHERE (cd.endTimestamp - (STRFTIME('%s','now')*1000)) > 0
			ORDER BY (cd.endTimestamp - STRFTIME('%s', 'now')*1000)
			LIMIT 5`,
		featuredCountdowns: `SELECT cd.id, cd.uuid, cd.title, cd.description, cd.startTimestamp, cd.endTimestamp
			FROM countdown cd
			WHERE (cd.endTimestamp - (STRFTIME('%s','now')*1000)) > 0
			ORDER BY cd.id
			LIMIT 3`,
		hashtagByName: `SELECT id FROM hashtag WHERE LOWER(name)= LOWER(?)`,
		twitterCacheByCountdown: `SELECT cache, expires FROM dirtyTwitterCache WHERE countdownId = (?)`
	}
};
