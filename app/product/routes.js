const koaBody = require('koa-body');
const Router = require('koa-router');
const ProductRepository = require('./repository').ProductRepository;
const ProductCodeRepository = require('./repository').ProductCodeRepository;
const ResourceRoutes = require('../resourceRoutes');

const ProductResourcePrefix = '/api/product';
const ProductCodeResourcePrefix = '/api/productCode';

module.exports = (app) => {

	const productRouter = new Router({
		prefix: ProductResourcePrefix
	});

	const productCodeRouter = new Router({
		prefix: ProductCodeResourcePrefix
	});
	
	// Increase Product Quantity
	productRouter.post('/:id/quantity/:quantity/increase', async (ctx) => {
		const resource = new ProductRepository();
		
		try {
			let result = await resource.increase(ctx.params.id, ctx.params.quantity);
			ctx.status = 200;
		} catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			ctx.status = error.status || 400;
			ctx.response.message = response;
		}
	});

	// Decrease Product Quantity
	productRouter.post('/:id/quantity/:quantity/decrease', async (ctx) => {
		const resource = new ProductRepository();

		try {
			let result = await resource.decrease(ctx.params.id, ctx.params.quantity);
			ctx.status = 200;
		} catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			ctx.status = error.status || 400;
			ctx.response.message = response;
		}
	});

	productCodeRouter.post('/load', koaBody({ multipart: true }),  async (ctx) => {
		const resource = await new ProductCodeRepository();
		
		let file = null;

		if (ctx.request.body.files.file) {
			file = ctx.request.body.files.file;
		}
		
		const fs = require('fs');

		let data = fs.readFileSync(file.path, 'utf8');
		
		let rows = data.split(/\r?\n/);

		let productCodes = [];
		
		for (let i in rows) {
			
			if (rows[i] == '')
				continue;

			let row = rows[i].split(',');
			
			productCodes.push({
				description: row[0]
			});
		}

		try {
			await resource.insertMany(productCodes, ctx.state.user);
			ctx.status = 200;

		} catch (error) {
			
			if (Array.isArray(error)) {
				let result = error.join(`\n`);
				ctx.set('Content-Type', 'text/csv');
				ctx.set('Content-disposition', 'attachment; filename=errors.csv');
				ctx.statusCode = 400;
				ctx.body = result;
			};

		}
	});
	
	// Add the Crud's web services
	ResourceRoutes(ProductResourcePrefix, productRouter, ProductRepository);
	ResourceRoutes(ProductCodeResourcePrefix, productCodeRouter, ProductCodeRepository);

	app.use(productRouter.routes());
	app.use(productCodeRouter.routes());

	return [productRouter, productCodeRouter];
}
