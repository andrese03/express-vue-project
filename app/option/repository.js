const md5 = require('md5');
const jwt = require('jsonwebtoken');
const ObjectID = require('mongodb').ObjectID;
const HTTPError = require('../errors').HTTPError;
const ResourceRepository = require('../resourceRepository');
const Database = require('../database');
const Config = require('../config')();
const UserSchema = require('./schema');

const UniqueProperties = [];

const CollectionName = 'option';

class OptionRepository extends ResourceRepository {
	
	// User's constructor
	constructor() {
		super(Database.get(), CollectionName, UserSchema, UniqueProperties);
	}

	async insert(document = null, user, options) {
		const _this = this;

		document = document || {};

		document.id = await _this.getAutoIncrementValue();

		// If the document type is 1 (Option) or 3 (Permission)
		// the parent equals to the same object
		if (document.type.id != 2) {
			document.parent = Number(document.id);
		}

		// If the document is type 3 (Permission), there's no
		// icon type configurated for this option
		if (document.type.id == 3) {
			delete document.icon;
		}

		options = Object.assign({useAutoIncrementValue: false}, options);

		return await super.insert(document, user, options);
	}

	async update (query = null, document = null, options = {}) {
		const _this = this;
		const _roleCollection = _this.db.collection('role');
		const _userCollection = _this.db.collection('user');

		// If the document type is 1 (Option) or 3 (Permission)
		// the parent equals to the same document
		if (document.type.id != 2) {
			document.parent = Number(document.id);
		}

		// If the document is type 3 (Permission), there's no
		// icon type configurated for this option
		if (document.type.id == 3) {
			delete document.icon;
		}

		await super.update(query, document, options);
		
		document = await _this.findById(query);

		var query = { 'options._id': ObjectID.createFromHexString(query) };
		
		let roles = await _roleCollection.find(query).toArray();
		
		// Dirty work :(
		for (let i in roles) {
			for (let j in roles[i].options) {
				if (roles[i].options[j]._id.toString() == document._id.toString()) {
					roles[i].options[j] = document;
					break;
				}
			}

			let _role = Object.assign({}, roles[i]);

			_roleCollection.updateOne({ _id: _role._id }, { $set : _role } );
			_userCollection.updateOne({ 'role._id': _role._id }, { $set: { 'role': _role } });
		};

		return document;
	}

	async delete (query = null, options = null) {
		const _this =  this;
		const _roleCollection = _this.db.collection('role');

		if ((await _roleCollection.count({'options._id': ObjectID.createFromHexString(query)})) > 0)
			throw new HTTPError(405, 'Existen roles que tienen esta opcion activada');
		
		return super.delete(query);
	}
}

module.exports = {
	OptionRepository
}