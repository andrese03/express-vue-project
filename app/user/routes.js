const UserRepository = require('./repository').UserRepository;
const ResourceRoutes = require('../resourceRoutes');

const ResourcePrefix = '/api/user';

module.exports = (app) => {
	
	// Login/Token
	app.post('/token', async (req, res) => {
		const resource = new UserRepository();
		try {
			let result = await resource.login(req.body.username, req.body.password);
			res.json(result);
		} catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(401).json(response);
		}
	});

	// Login/Token
	app.get(ResourcePrefix + '/token', async (req, res, next) => {
		const resource = new UserRepository();
		try {
			let result = await resource.findById(req.user._id.toString());
			delete result.password;
			res.json(result);
		} catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(401).json(response);
		}
	});

	// Reset Password
	app.post(ResourcePrefix + '/:id/password/reset', async (req, res) => {
		const resource = new UserRepository();
		try {
			let result = await resource.resetPassword(req.params.id);
			res.status(200).end();
		} catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(400).json(response);
		}
	});

	// Change Password
	app.post(ResourcePrefix + '/:id/password/change', async (req, res) => {
		const resource = new UserRepository();
		if (req.params.id != req.user._id) {
			req.status(403).end();
		}
		try {
			let result = await resource.changePassword(req.params.id, req.body.password);
			res.end();
		} catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(400).json(response);
		}
	});

	// Validate Password
	app.post(ResourcePrefix + '/:id/password/validate', async (req, res, next) => {
		const resource = new UserRepository();
		if (req.params.id != req.user._id) {
			res.status(403).end();
		}
		try {
			let result = await resource.validatePassword(req.params.id, req.body.password);
			res.end();
		} catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(400).json(response);
		}
	});

	// Change Password
	app.post(ResourcePrefix + '/:id/activate/:activate', async (req, res) => {
		const resource = new UserRepository();
		try {
			let result = await resource.activate(req.params.id, Number(req.params.activate));
			res.end();
		} catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(400).json(response);
		}
	});

	// Insert is Register/Sign-in
	app.post(ResourcePrefix + '/', async (req, res, next) => {
		const resource = new UserRepository();
		if (!await resource.isUnique(req.body)) {
			res.status(400).json('El nombre de usuario o correo que está colocando ya existen');
		}
		try {
			let result = await resource.register(req.body, req.user);
			res.json(result);
		}catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(400).json(response);
		}
	});


	// Update is deprecated
	app.put(ResourcePrefix + '/:id', async (req, res, next) => {
		const resource = new UserRepository();
		let id = req.params.id || req.body._id;
		
		let user = await resource.findById(id);
		if (user == null) {
			req.status(404).end();
			return;
		}

		if (!await resource.isUnique(req.body)) {
			ctx.status(400).end('El nombre de usuario o correo que está colocando ya existen');
			return;
		}

		try {
			let result = await resource.update(id, req.body, { validateDuplicates: false });
			res.json(result);
		}
		catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(401).json(response);
		}
	});

	
	// Add the Crud's web services
	ResourceRoutes(ResourcePrefix, app, UserRepository);

	return app;
}
