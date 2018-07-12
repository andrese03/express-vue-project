const md5 = require('md5');
const jwt = require('jsonwebtoken');
const ObjectID = require('mongodb').ObjectID;
const HTTPError = require('../errors').HTTPError;
const ResourceRepository = require('../resourceRepository');
const Database = require('../database');
const Config = require('../config')();
const ProductSchema = require('./schema').ProductSchema;
const ProductCodeSchema = require('./schema').ProductCodeSchema;

const ProductUniqueProperties = ['description', 'productCode.description'];
const ProductCodeUniqueProperties = ['description'];

const ProductCollectionName = 'product';
const ProductCodeCollectionName = 'productcode';

class ProductRepository extends ResourceRepository {
	
	constructor() {
		super(Database.get(), ProductCollectionName, ProductSchema, ProductUniqueProperties);
		this.productCodeResource = new ProductCodeRepository();
	}

	async insert(document, user = null, options = {}) {
		const _this = this;
		
		let validation = await _this.isValidSchema(document, _this.schema);
		if (!validation.isValid)
			throw validation.errors;
		
		// Checks if there's already a duplicated
		await _this.validateDuplicates(document)
		options = Object.assign(options, { validateSchema: false });

		_this.minifyProductCode(document);

		document.quantity = document.quantity || 0;
		
		let result = null;

		try {
			await _this.productCodeResource.lock(document.productCode._id);
			result = super.insert(document, user, options);
		}
		catch (e) {
			await _this.productCodeResource.unlock(document.productCode._id);
			throw e;
		}

		return result;
	}
	
	async update(query = null, document = null, options = {}) {
		const _this = this;

		// Checks if there's already a duplicated
		await this.validateDuplicates(document);
		_this.minifyProductCode(document);

		let currentProduct = await _this.findById(document._id);

		let result = null;
		try {
			
			if (currentProduct.productCode._id.toString() != document.productCode._id.toString()) {
				await _this.productCodeResource.unlock(currentProduct.productCode._id);
				await _this.productCodeResource.lock(document.productCode._id);
			}
			result = super.update(query, document, options);
		}
		catch (e) {
			if (currentProduct.productCode._id.toString() != document.productCode._id.toString()) {
				await _this.productCodeResource.lock(currentProduct.productCode._id);
				await _this.productCodeResource.unlock(document.productCode._id);
			}
			throw e;
		}
		
		return result;
	}

	async delete(query = null, options = {}) {
		const _this = this;
		let result = null;
		let id = null;
		
		if (query == null)
			throw new Error('query is not defined');

		if (ObjectID.isValid(query))
			id = ObjectID.createFromHexString(query);

		let currentProduct = await _this.findById(query);
		
		try {
			await _this.productCodeResource.unlock(currentProduct.productCode._id);
			result = await super.delete(query, options);
		}
		catch (e) {
			await _this.productCodeResource.lock(currentProduct.productCode._id);
			throw e;
		}
		return result;
	}

	/**
	 * Increases the quantity of a product
	 * @param {ObjectID} id The document id. Could be a string or an ObjectID
	 * @param {Integer} quantity The product quantity to increase
	 */
	async increase(id = null, quantity = 0) {
		const _this = this;

		if (id == null) {
			throw new HTTPError(400);
		}

		let product = await _this.findById(id);
		if (!product) {
			throw new HTTPError(404);
		}

		product.quantity+= Number(quantity);

		return super.update(id, product, { validateDuplicates: false, validateSchema: false });
	}

	/**
	 * Decreases the quantity of a product
	 * @param {ObjectID} id The document id. Could be a string or an ObjectID
	 * @param {Integer} quantity The product quantity to decrease
	 */
	async decrease(id = null, quantity = 0) {
		const _this = this;

		quantity = quantity * -1;
		
		return _this.increase(id, quantity);
	}

	/**
	 * This method allows to checks if there's already a product with the product description or the productCode description
	 * @param {object} object The document that will be evaluated for duplicates
	 */
	async validateDuplicates (document) {
		const _this = this;

		const options = {
			selector: {
				'$or': [
					{ 'description': document.description },
					{ 'productCode.description': document.productCode.description }
				]
			},
			limit: 1
		};
		
		if (document._id) {
			options.selector['_id'] = { '$ne' : (!ObjectID.isValid(document._id) ? document._id : ObjectID.createFromHexString(document._id)) };
		}

		let product = (await _this.find(options))[0];

		if (product && product.description == document.description) {
			throw new HTTPError(409, `El nombre de este producto ya existe`);
		}
		
		if (product && product.productCode.description == document.productCode.description) {
			throw new HTTPError(409, `Este código de producto existe para el producto "${product.description}"`);
		}
	}

	/**
	 * Extracts only the necesary for the product code
	 * @param {object} document Product to be modified
	 */
	minifyProductCode(document) {
		document.productCode = {
			_id: document.productCode._id,
			id: document.productCode.id,
			description: document.productCode.description,
		};
	}
}

class ProductCodeRepository extends ResourceRepository {
	
	constructor() {
		super(Database.get(), ProductCodeCollectionName, ProductCodeSchema, ProductCodeUniqueProperties);
	}

	async lock(id, shouldLock=true) {
		const _this = this;

		let query = {};
		
		if (id) {
			query['_id'] = (!ObjectID.isValid(id) ? id : ObjectID.createFromHexString(id.toString()));
		}
		
		await _this.update(query, { active: !shouldLock }, { validateDuplicates: false, validateSchema: false });

		return true;
	}

	async unlock(id) {
		const _this = this;
		
		return await _this.lock(id, false);
	}

	async insertMany(documents = [], user = null, options = {}) {
		const _this = this;
		const validateSchema = false;
		const validateDuplicates = false;
		const waitForSave = true;
		
		const _options = Object.assign(options, {
			validateSchema,
			validateDuplicates,
			waitForSave
		});

		const _documents = [];
		const errors = [];
		for (var document of documents) {
			if (!await _this.isUnique(document)) {
				errors.push(document.description);
				continue;
			}
			_documents.push(await _this.insert(Object.assign({}, document), user, _options));
			
		}

		let result = _this.db.collection(_this.collection).insertMany(_documents);

		if (errors.length) {
			throw errors;
		}

		return errors



	}
}

module.exports = {
	ProductRepository,
	ProductCodeRepository
}