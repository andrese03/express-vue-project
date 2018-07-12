require('dotenv').config();
const { APP_PORT, JWT_SECRET } = process.env;

const express = require('express');
const bodyParser = require('body-parser');

const { version: frontend } = require('./client/package.json');
const { version: backend } = require('./package.json');

const jwt = require('express-jwt');
const ResourceDatabase = require('./app/database');

(async () => {

	await ResourceDatabase.connect();

	const app = express();
	const port = APP_PORT || 5000;

	// BodyParser to fetch each JSON Request Body
	app.use(bodyParser.urlencoded({ jsonLimit: '16mb', extended: true }));
	app.use(bodyParser.json({ jsonLimit: '16mb', extended: true }));

	
	// Middleware below this line is only reached if JWT token is valid
	const path = [/^\/public/, '/token', '/register'];
	app.use(jwt({ secret: JWT_SECRET }).unless({ path }));
	
	// Custom 401 handling if you don't want to expose jwt errors to users
	app.use(custom401Handling);
	
	// Middleware to fetch the entire user for the request
	app.use(async (req, res, next) => {
		if (req.user) {
			const resource = new (require('./app/user/repository').UserRepository)();
			req.user = await resource.findById(req.user._id);
		}
		return next();
	});

	// Automatically looks for a routes.js file into each ./app/resourceName and tries to run it
	const webServices = [
		'user',
		// 'role',
		// 'option',
		// 'product'
	];

	webServices.forEach((resourceName) => {
		require(`./app/${resourceName}/routes`)(app);
	});

	// TODO
	((app) => {
		const lists = require('./app/lists');
		const getLists = (req, res) => {
			const listNames = req.body || [];
			let _list = {};
			for (let key in listNames) {
				let prop = listNames[key];
				_list[prop] = lists[prop];
			}
			_list = (listNames.length) ? _list : lists;
			res.status(200).json(_list);
		}
		app.post('/api/lists', getLists); // Funcion para obtener las listas
	})(app)

	// Server Run
	app.listen(port, () => {
		console.log('[*] Server Running on Port:', port);
	});

})();

process.on('unhandledRejection', (reason, promise) => {
	console.log('Unhandled Rejection at Promise:', promise);
	console.log('Reason', reason);
});

const custom401Handling = (err, req, res, next) => {
	if (err.name === 'UnauthorizedError') {
		res.status(err.status).send({ message: 'An Unicorn is protecting this resource, use Authorization header to get access.' });
		// logger.error(err);
		return;
	}
	next();
}