const db = global.db;

let helpers = {}

helpers.queryAll = function(sqlStatement) {
	return new Promise((resolve, reject) => {
		db.all(sqlStatement, (error, rows) => {
			if (error) {
				reject(error);
			} else {
				resolve(rows);
			}
		});
	});
};

helpers.prepareStatement = function(sqlStatement, values) {
	return new Promise((resolve, reject) => {
		let preparedStatement = db.prepare(sqlStatement);
		preparedStatement.bind(values, error => {
			if (error) {
				console.error(error);
				reject(error);
			}
			resolve(preparedStatement);
		});
	});
}

helpers.runPreparedStatement = function(preparedStatement) {
	return new Promise((resolve, reject) => {
		preparedStatement.run(function(error) {
				if (error != null) {
					console.error(error);
					reject(error);
				}

				resolve(this.lastID);
			});
	});
}

helpers.runStatement = function(statement, values) {
	return helpers.prepareStatement(statement, values).then(preparedStatement => {
		return helpers.runPreparedStatement(preparedStatement)
	});
}

module.exports = helpers;
