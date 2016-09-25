module.exports = {
	init: [
		`CREATE TABLE IF NOT EXISTS 'countdown' (
			'id'	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
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
		)`
	],
	insert: {
		createCountdown: `INSERT INTO countdown (title, description, startTimestamp, endTimestamp, createdTimestamp, deletePassphrase)
						VALUES ($title, $description, $startTimestamp, $endTimestamp, $createdTimestamp, $deletePassphrase)`,
		createHashtag: `INSERT INTO hashtag ('name') VALUES (?);`,
		createHashtagAssociation: `INSERT INTO hashtagAssociation (hashtagId, countdownId) VALUES(?, ?)`
	},
	select: {
		countdown: `SELECT cd.id, cd.title, cd.description, cd.startTimestamp, cd.endTimestamp
			FROM countdown cd
			WHERE cd.id = ?`,
		hashtagsForCountdown: `SELECT ht.name
			FROM hashtagAssociation hA
			JOIN hashtag ht ON hA.hashtagId = ht.id
			WHERE hA.countdownId = ?`
	}
};
