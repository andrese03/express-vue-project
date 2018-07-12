const md5 = require('md5');
const jwt = require('jsonwebtoken');
const ObjectID = require('mongodb').ObjectID;
const HTTPError = require('../errors').HTTPError;
const ResourceRepository = require('../resourceRepository');
const Database = require('../database');
const UserSchema = require('./schema');

const { JWT_SECRET } = process.env;

const UniqueProperties = ['username', 'email'];

const CollectionName = 'user';

class UserRepository extends ResourceRepository {
	
	// User's constructor
	constructor() {
		super(Database.get(), CollectionName, UserSchema, UniqueProperties);
	}

	//Log in
	async login(username, password) {
		const _this = this;
		
		let options = {
			'selector': {
				'username': username,
				'password': md5(password),
				'active': true
			},
			'projection': ['username', 'email', 'profile']
		};

		let result = await _this.find(options);
		
		if (result.length < 1)
			throw new HTTPError(401, 'El usuario o contraseña son inválidos');

		let user = result[0];
		user.token = jwt.sign(user, JWT_SECRET);

		return user;
	}

	async register(object, user) {
		const  _this = this;
		
		// Check for duplicates
		if (!await _this.isUnique(object))
			throw new HTTPError(409, 'Este usuario ya existe en el sistema');

		object.password = md5(object.username);

		return await _this.insert(object, user, { validateDuplicates: false });
	}

	// Reset Password
	async resetPassword (id) {
		const _this = this;
		let user = await _this.findById(id);

		if (user == null) {
			throw new HTTPError(404);
		}
		
		user.password = md5(user.username);

		await _this.update(id, user, {validateDuplicates: false, validateSchema: false});

		return user;
	}

	// Change Password
	async changePassword (id, pass) {
		const _this = this;

		let user = await _this.findById(id);

		if (user == null) {
			throw new HTTPError(404);
		}

		user.password = md5(pass);

		await _this.update(id, user, { validateDuplicates: false, validateSchema: false });
		
		return user;
	}

	// Validate Password
	async validatePassword(id, password) {
		const _this = this;

		let user = await _this.findById(id);

		if (user == null) {
			throw new HTTPError(404);
		}

		let options = {
			'selector': {
				'username': user.username,
				'password': md5(password)
			},
			'projection': ['username', 'email', 'profile']
		};

		let result = await _this.find(options);

		if (result.length < 1)
			throw new HTTPError(401, 'La contraseña actual no es válida');
			
		return user;
	}

	async activate(id, activate) {
		const _this = this;
		let user = await _this.findById(id);

		if (user == null) {
			throw new HTTPError(404);
		}

		user.active = !!activate;

		await _this.update(id, user, { validateDuplicates: false, validateSchema: false });

		return user;
	}

}

module.exports = {
	UserRepository
}