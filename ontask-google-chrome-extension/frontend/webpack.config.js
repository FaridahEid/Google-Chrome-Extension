const path = require('path');

module.exports = {
	entry:{login: "./src/login.js", groups: "./src/groups.js", send: "./src/send.js", results: "./src/results.js", create: "./src/create.js"},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, "dist")
	}

};