'use strict'
var utils = require('./utils');

module.exports = function (prefix, app, ResourceRepository) {
	var success = utils.success;
	var failed = utils.failed;
	var credentials = utils.credentials;

	// Find by Id
	app.get('/:id', async (req, res) => {
		const resource = new ResourceRepository();
		let result = await resource.findById(req.params.id);
		if (result == null)
			return req.status(404).end();
		res.json(result);
	});
	// console.log(`[*] GET ${prefix}/:id`);
	
	/**
	 * [Find|Count|Distinct] by Selector, todos los parametros son opcionales (excepto search, que requiere fields)
	 * {
	 *  "selector": {
	 *    "ownerId": 1
	 *  },
	 *  "search": "Test",
	 *  "distinct": "name"
	 *  "fields": ["ownerId", "name", "description"],
	 *  "projection": ["ownerId", "name", "description"],
	 *  "limit": 24,
	 *  "skip": 1,
	 *  "sort": {"ownerId":1, "createdDate":-1},
	 *  "credentials": false,
	 *  "date": [
	 *    {"field": "createdDate", "from":"2016-06-08T04:00:00.000Z", "to": "2016-06-09T04:00:00.000Z"}
	 *    {"field": "birthDate", "from":"2016-06-08T04:00:00.000Z", "to": "2016-06-09T04:00:00.000Z"}
	 *  ]
	 */
	
	// Find
	app.post('/find', async (req, res) => {
		const resource = new ResourceRepository();
		let result = await resource.find(req.body);
		res.json(result);
	});
	// console.log(`[*] POST ${prefix}/find`);
	
	// Count
	app.post('/count', async (req, res) => {
		const resource = new ResourceRepository();
		let result = await resource.count(req.body);
		res.json(result);
	});
	// console.log(`${prefix}/count`);

	// Distinct
	app.post('/distinct', async (req, res) => {
		const resource = new ResourceRepository();
		let result = await resource.distinct(req.body);
		res.json(result);
	});
	// console.log(`${prefix}/distinct`);

	// Insert
	app.post("/", async (req, res) => {
		const resource = new ResourceRepository();

		try {
			let result = await resource.insert(req.body, req.user);
			res.json(result);
		}
		catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(400).json(response);
		}
	});
	// console.log(`${prefix}/insert`);

	// Update
	app.put(['', '/:id'], async (req, res) => {
		const resource = new ResourceRepository();
		let id = req.params.id || req.body._id;
		
		let user = await resource.findById(id);
		if (user == null) {
			res.status(404).end();
			return;
		}

		try {
			let result = await resource.update(id, req.body);
			res.json(result);
		}
		catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(400).json(response);
		}
	});
	// console.log(`${prefix}/update`);
	
	// Delete
	app.delete('/:id', async (req, res) => {
		const resource = new ResourceRepository();
		let id = req.params.id;

		let user = await resource.findById(id);
		if (user == null) {
			res.status(404).end();
			return;
		}

		try {
			let result = await resource.delete(id);
			res.status(204).end();
		}
		catch (error) {
			const response = (error instanceof Error) ? error.message : error;
			res.status(400).json(response);
		}
	});
	// console.log(`${prefix}/delete`);
	

};
