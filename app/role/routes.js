const RoleRepository = require('./repository').RoleRepository;
const ResourceRoutes = require('../resourceRoutes');

const ResourcePrefix = '/api/role';

module.exports = (app) => {
	const Router = app.router();

	// Add the Crud's web services
	ResourceRoutes(ResourcePrefix, router, RoleRepository);

	app.use(router.routes());

	return router;
}
