const utils = require('./utils');
const moment = require('moment');
const Validator = require('jsonschema').Validator;
const ObjectID = require('mongodb').ObjectID;
const HTTPError = require('../app/errors').HTTPError;

/**
 * Caracteres del alfabeto con sus acentuaciones
 * Usado para crear el Regex de AdvancedSearch
 */
const accented = {
	'A': '[aàáâäãÅåæ]',
	'B': '[bß]',
	'C': '[cçÇ]',
	'D': '[d]',
	'E': '[eèéêëÆæœ]',
	'F': '[f]',
	'G': '[g]',
	'H': '[h]',
	'I': '[iíïî]',
	'J': '[j]',
	'K': '[k]',
	'L': '[l]',
	'M': '[m]',
	'N': '[nñ]',
	'O': '[oòóõöôØøœ]',
	'P': '[p]',
	'Q': '[q]',
	'R': '[r]',
	'S': '[s]',
	'T': '[t]',
	'U': '[uûüùú]',
	'V': '[v]',
	'W': '[w]',
	'X': '[x]',
	'Y': '[yýÿ]',
	'Z': '[z]'
};

class MongoRepository {

	// Class Constructor
	constructor(db, collection, schema, uniqueProperties) {
		this.db = db;
		this.collection = collection;
		this.schema = schema;
		this.uniqueProperties = uniqueProperties || [];
		this.validator = new Validator();
	}

	/**
	 * Verifica si el objeto a ser insertado ya lo esta
	 * Recibe un arreglo de keys, si al menos encuentra un objeto con una propiedad
	 * que tenga el mismo valor retorna un error. Ej. ['_id','nombre']
	 * Si desea validar varios keys juntos como un primary key de varias variables,
	 * envie en lugar de un key, un arreglo de keys Ej. ['_id','nombre',['_id','doctorId']]
	 */
	async isUnique(object = null) {
		const _this = this;
		const query = { '$or': [] };
		const uniqueProperties = _this.uniqueProperties || [];

		if (object == null) {
			throw new Error("Can't verify if the object is unique, parammeter 'object' is null or undefined");
		}

		if (uniqueProperties.length === 0) {
			return true;
		}

		if (object._id) {
			if (typeof object._id == 'string' && ObjectID.isValid(object._id)) {
				object._id = ObjectID.createFromHexString(object._id);
			}
			query._id = {
				$ne: object._id
			};
		}

		for (var x in uniqueProperties) {
			var property = {};

			if (Array.isArray(uniqueProperties[x])) {
				property.$and = uniqueProperties[x].reduce((array = [], field) => {
					if (object[field])
						array.push({ [field]: object[field] });
					return array;
				})
			} else {
				property[uniqueProperties[x]] = object[uniqueProperties[x]];
			}

			if (property[uniqueProperties[x]] || (property.$and && property.$and.length > 0))
				query.$or.push(property);
		}
		
		let result = await _this.db.collection(_this.collection).findOne(query);
		
		return !(result && result._id);

	}

	// TODO: Doc this one
	async getAutoIncrementValue() {
		const _this = this;
		const collection = _this.collection;
		const db = _this.db;
		const sequenceCollection = db.collection('sequence');

		try {
			let result = await sequenceCollection.findAndModify({ collection: collection }, null, { $inc: { sequence: 1 } }, { new: false });

			if (result.value == null) {
				sequenceCollection.insert({ collection: collection, sequence: 2 });
				return 1;
			} else {
				return result.value.sequence;
			}

		} catch (e) {
			throw e;
		}
	}

	/**
	 * Valida que el el objeto a insertar cumpla con el esquema de datos
	 * por defecto toma el schema pasado en el constructor en caso de no tener
	 */
	async isValidSchema(object, schema) {
		const _this = this;
		// El Schema no está definido
		if (schema == null) {
			throw new Error('Schema is not defined');
		}

		schema = schema;
		let validation = _this.validator.validate(object, schema);

		// Hay errores en el Schema
		if (validation.errors.length > 0)
			return { isValid: false, errors: validation.errors };

		// No hay errores
		else
			return { isValid: true };
	}

	/**
	 * Es quien se encarga de construir los parametros para busquedas
	 * Actualmente trabaja para find y count. 08/06/2016
	 */
	async buildSelector(options = {}) {
		
		try {
			const _this = this;
			let date = options.date;
			let search = options.search;
			let fields = options.fields || [];
			let projection = options.projection || [];
			let selector = {};
			let pagination = {};
			let distinct = options.distinct || null;

			// Filtro Avanzado
			if (options.selector) {

				selector = options.selector || {};
				// Si el filtro viene como string se intenta parsear
				if (typeof options.selector == 'string') {
					try {
						selector = JSON.parse(options.selector);
					}
					catch (e) {
						console.log('[*] Error parsing options.selector', e.message);
					}
				}

				// TODO: Test
				selector = utils.convertPropertiesToDate(selector);
			}

			// Pagination Options
			pagination = {
				limit: options.limit || 0,
				skip: options.skip || 0,
				sort: options.sort || [['_id', 1]]
			}

			if (projection.length) {
				pagination.projection = projection;
			}

			// El texto de busqueda se convierte en una expresión regular
			search = (search)
				? _this.convertStringToRegularExpression(search)
				: null;

			// Se inicia la busqueda sabiendo que hay campos y un texto que buscar
			if (Array.isArray(fields) && fields.length > 0 && search) {

				selector.$or = selector.$or || [];

				for (var i in fields) {
					var field = fields[i];

					if (field == '*')
						continue;

					var condition = {};

					if (isNaN(search)) {
						condition[field] = { $regex: search, $options: 'i' }
					}
					else {
						condition[field] = Number(search)
						var _condition = {}
						_condition[field] = {
							$regex: search.join(),
							$options: 'i'
						};
						selector.$or.push(_condition);
					}
					selector.$or.push(condition);
				};

				// Si la busqueda se quedó vacia, se elimina el or
				if (selector.$or.length == 0) {
					delete selector.$or;
				}
			}

			// Filtro por multiples campos para fecha
			if (date != undefined && date != "") {
				// console.log('[*] Date Range');
				selector.$and = (selector.$and) ? selector.$and : [];

				date.forEach(function (params) {
					var dateFrom = (params.from) ? moment(params.from).toDate() : null;
					var dateTo = (params.to) ? moment(params.to).toDate() : null;
					var condition = {};
					condition[params.field] = {};
					if (dateFrom)
						condition[params.field].$gte = dateFrom;
					if (dateTo)
						condition[params.field].$lte = dateTo;
					selector.$and.push(condition);
				});
			}

			// console.log("[*] Where");
			// console.log(JSON.stringify(selector));

			// console.log("[*] Pagination");
			// console.log(JSON.stringify(pagination));

			return { selector, pagination, distinct }
		}
		catch (e) {
			// Error construyendo parametros
			throw new Error('Error while building query and options: ' + e.message);
		}
	}

	/**
	 * Encuentra un objeto por su _id
	 */
	async findById(id = null, options = {}) {
		const _this = this;
		let query = null;

		if (id == null) {
			throw new Error('id is required');
		}

		if (ObjectID.isValid(id)) {
			query = { _id: ObjectID.createFromHexString(id) };
		}
		
		if (query == null)
			return null;

		let result = await _this.db.collection(_this.collection).findOne(query, options);

		return result;
	}

	/**
	 * Search (With Advanced Search)
	 *
	 * search: a string that is going to be look in a set of fields
	 * fields: array of strings with the fields names that the 'search' attribute is going to be looked in
	 * limit: number of records
	 * skip: number of records to be skipped
	 * sort: object with the fields in which the query is going to be sorted
	 * selector: selector that is gonna be used, must be passed as a String
	 * credentials: boolean that indicates whether the search needs credentials or not, by default is true
	 */
	async find(options) {
		const _this = this;

		options = await _this.buildSelector(options);
		return new Promise((resolve, reject) => {
			try {
				_this.db.collection(_this.collection).find(options.selector, options.pagination).toArray(_this.handleMongoResponse(resolve, reject));
			}
			catch (e) {
				// Error en busqueda paginada
				reject(e);
			}
		});
	}

	/**
	 * Count (With Advanced Search)
	 *
	 * search: a string that is going to be look in a set of fields
	 * fields: array of strings with the fields names that the 'search' attribute is going to be looked in
	 * limit: number of records
	 * skip: number of records to be skipped
	 * sort: object with the fields in which the query is going to be sorted
	 * selector: selector that is gonna be used, must be passed as a String
	 * credentials: boolean that indicates whether the search needs credentials or not, by default is true
	 */
	async count(options = {}) {
		var _this = this;

		options = await _this.buildSelector(options);

		return new Promise((resolve, reject) => {
			_this.db.collection(_this.collection).count(options.selector, _this.handleMongoResponse(resolve, reject));
		});

	}

	/**
	 * TBD
	 */
	async distinct(options) {
		const _this = this;
		options = await _this.buildSelector(options);
		if (!options.distinct)
			throw new Error('Distinct criteria is required');

		return new Promise((resolve, reject) => {
			_this.db.collection(_this.collection).distinct(options.distinct, options.selector, _this.handleMongoResponse(resolve, reject));
		});
	}

	/**
	 * Inserta un Objeto en la Base de Datos
	 * Se puede enviar un Schema en caso de no querer usar el que está por defecto
	 */
	async insert(object, user = null, options = {}) {
		const _this = this;
		const validateSchema = (options.validateSchema == false) ? false : true;
		const validateDuplicates = (options.validateDuplicates == false) ? false : true;
		const useAutoIncrementValue = (options.useAutoIncrementValue == false) ? false : true;
		const waitForSave = options.waitForSave || false;
		
		// Objeto Inválido
		if (!object)
			throw new Error('Error, object is required');

		object = utils.convertPropertiesToDate(object);

		object = utils.convertPropertiesToObjectID(object);
		
		object.active = true;	

		object.createdDate = new Date();

		object.modifiedDate = null;

		if (user != null) {
			const userDetail = {
				_id: user._id,
				username: user.username,
				fullName: ((user.profile.firstName || '') + ' ' + (user.profile.lastName || '')).trim()
			}
			object.createdBy = userDetail;
			object.owner = userDetail;
		}
		try {
			
			// Validate object before insert
			if (validateSchema) {
				let validation = await _this.isValidSchema(object, _this.schema);
				if (!validation.isValid)
				throw validation.errors;
			}
			
			// Check if there's an external Id and validate if the Object Exists
			if (validateDuplicates && !await _this.isUnique(object, _this, _this.composedKey)) {
				throw new HTTPError(409, 'This object already exists');
			}

			if (useAutoIncrementValue) {
				let sequence = await _this.getAutoIncrementValue(_this.db);
				object.id = sequence;
			}

			let result = (waitForSave) ? object : (await _this.db.collection(_this.collection).insert(object)).ops[0];

			return result;
			
		} catch (error) {
			
			// Validation Error
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			
			throw error;

		}
		
	}

	/**
	 * Actualiza un Objeto en la Base de Datos
	 * Se puede enviar un Schema en caso de no querer usar el que está por defecto
	 */
	async update(query = null, object = null, options = {}) {
		const _this = this;
		const validateSchema = options.validateSchema || false;
		const validateDuplicates = (options.validateDuplicates == false) ? false : true;

		if (query == null || JSON.stringify(query) == '{}')
			throw new HTTPError(400, 'id is not defined');
		
		if (object == null || JSON.stringify(object) == '{}')
			throw new HTTPError(400, 'object is not defined');
		
		if (ObjectID.isValid(query)) {
			query = { _id: ObjectID.createFromHexString(query) };
		}

		// Parse date properties
		object = utils.convertPropertiesToDate(object);

		object = utils.convertPropertiesToObjectID(object);
		
		// Validate object before insert
		if (validateSchema) {
			let validation = await _this.isValidSchema(object, _this.schema);
			if (!validation.isValid)
			throw validation.errors;
		}
		
		// Check if there's an external Id and validate if the Object Exists
		if (validateDuplicates && !await _this.isUnique(object, _this, _this.composedKey)) {
			throw new HTTPError(409, 'This object already exists');
		}

		// Asign ObjectID if not included
		delete object._id;

		object.modifiedDate = new Date();
		
		let result = await _this.db.collection(_this.collection).update(query, { $set: object });
		
		return (!result.result.ok) ? null : object;
	}

	/**
	 * Borra un objeto por su _id
	 * Mas adelante agregarle que se pueda borrar por algún parametro extra
	 */
	async delete(query = null, options = null) {
		var _this = this;

		if (query == null || JSON.stringify(query) == '{}')
			throw new Error('query is not defined');

		if (ObjectID.isValid(query)) {
			query = { _id: ObjectID.createFromHexString(query) };
		}

		if (query == null) {
			throw new HTTPError(404);
		}

		let result = await _this.db.collection(_this.collection).deleteOne(query, options);

		return (result.result.n > 0) ? result.result.n : 0;
	}

	/**
	 * Funcion rapida para la ejecucion de queries en MongoClient
	 * No funciona para todos los casos
	 */
	handleMongoResponse(resolve, reject) {
		return function (err, data) {
			if (err) {
				reject({ message: err })
			}
			else {
				resolve(data);
			}
		};
	}

	/**
	 * Convierte un String en una expresión Regular para poder filtrar
	 * palabras que contengan acentos u otros signos de puntuación
	 */
	convertStringToRegularExpression(string) {
		var _string = '';
		string = (string || '').toUpperCase();
		for (var x in string) {
			_string = _string.concat(accented[string[x]] || string[x]);
		}

		var split = _string.split(' ');
		for (var x in split) {
			split[x] = '(?=.*' + split[x] + ')';
		}
		var _string = '';
		for (var x in split) {
			_string = _string.concat(split[x]);
		}
		return _string;
	}
}

module.exports = MongoRepository;