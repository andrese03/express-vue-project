const Router = require('koa-router');
const RoleRepository = require('./repository').OptionRepository;
const ResourceRoutes = require('../resourceRoutes');

const ResourcePrefix = '/api/option';

module.exports = (app) => {

	const router = new Router({
		prefix: ResourcePrefix
	});
	
	// Add the Crud's web services
	ResourceRoutes(ResourcePrefix, router, RoleRepository);

	app.use(router.routes());

	return router;
}
