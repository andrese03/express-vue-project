const md5 = require('md5');
const jwt = require('jsonwebtoken');
const ObjectID = require('mongodb').ObjectID;
const HTTPError = require('../errors').HTTPError;
const ResourceRepository = require('../resourceRepository');
const Database = require('../database');
const Config = require('../config')();
const UserSchema = require('./schema');

const UniqueProperties = ['name'];

const CollectionName = 'role';

class RoleRepository extends ResourceRepository {
	
	// User's constructor
	constructor() {
		super(Database.get(), CollectionName, UserSchema, UniqueProperties);
	}

	async update (query, object) {
		const _this = this;
		const _userCollection = _this.db.collection('user');

		if (!await _this.isUnique(object)) {
			throw new Error("Este rol ya existe");
		}

		await super.update(query, object, { validateDuplicates: false});

		let role = await _this.findById(query);

		await _userCollection.update({ 'role._id': ObjectID.createFromHexString(query) }, { $set: { role: role } }, { multi: true });

		return object;
	}

	async delete(query = null, options = null) {
		const _this = this;
		const _userCollection = _this.db.collection('user');

		if ((await _userCollection.count({ 'role._id': ObjectID.createFromHexString(query) })) > 0)
			throw new HTTPError(405, 'Existen usuarios que tienen esta opcion activada');

		return super.delete(query);
	}
}

module.exports = {
	RoleRepository
}