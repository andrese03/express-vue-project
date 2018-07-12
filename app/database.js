const md5 = require('md5');
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const Lists = require("./lists");

const { MONGO_URI, MONGO_DATABASE } = process.env;

let state = {
	db: null,
}

exports.connect = async (url, dbName) => {
	if (state.db != null)
		return state.db;
	state.db = (await MongoClient.connect(url || MONGO_URI, { useNewUrlParser: true })).db(dbName || MONGO_DATABASE);
	return state.db;
}

exports.get = () => {
	return state.db;
}

exports.close = async (done) => {
	if (state.db) {
		return await state.db.close();
	}
}

exports.feed = async () => {

	const db = await this.connect(MONGO_URI, MONGO_DATABASE);

	const createdBy = {
		"_id": new ObjectID(),
		"id": 1,
		"username": "admin",
		"fullName": "System Administrator"
	}

	const optionTypes = Lists.optionTypes;

	const options = [{
		"_id": new ObjectID(),
		"id": 1,
		"type": Lists.optionTypes[0],
		"label": "Usuarios",
		"value": "users",
		"parent": 1,
		"createdDate": new Date(),
		"createdBy": createdBy,
		"owner": createdBy,
		"icon": "users",
		"active": true
	}, {
		"_id": new ObjectID(),
		"id": 2,
		"type": Lists.optionTypes[0],
		"label": "Roles",
		"value": "roles",
		"parent": 2,
		"createdDate": new Date(),
		"createdBy": createdBy,
		"owner": createdBy,
		"icon": "lock",
		"active": true
	}, {
		"_id": new ObjectID(),
		"id": 3,
		"type": Lists.optionTypes[0],
		"label": "Opciones",
		"value": "options",
		"parent": 3,
		"createdDate": new Date(),
		"createdBy": createdBy,
		"owner": createdBy,
		"icon": "tasks",
		"active": true
	}];

	const roles = [
		{
			_id: new ObjectID(),
			"id": 1,
			"name": "Administrador",
			"options": options,
			"createdBy": createdBy,
			"active": true
		}
	]

	const user = {
		"_id": createdBy._id,
		"id":1,
		"username": "admin",
		"role": roles[0],
		"password": md5("admin"),
		"jobTitle": "Administrator",
		"email": "admin@admin.com",
		"createdDate": new Date(),
		"owner": createdBy,
		"profile": {
			"firstName": "System",
			"lastName": "Administrator"
		},
		"createdBy": createdBy,
		"active": true
	};

	const sequences = [
		{ collection: "option", sequence: 4 },
		{ collection: "role", sequence: 2 },
		{ collection: "user", sequence: 2 }
	];

	// Insertar Opciones
	let count = 0;

	count = await state.db.collection("option").count();
	if (!count)
		await state.db.collection("option").insert(options);
	console.log('[*] Options Inserted!');
	
	// Insertar Roles
	count = await state.db.collection("role").count();
	if (!count)
	await state.db.collection("role").insert(roles);
	console.log('[*] Roles Inserted!');
	
	// Insertar un Usuario Administrador
	count = await state.db.collection("user").count();
	if (!count)
	await state.db.collection("user").insert(user);
	console.log('[*] User Inserted!');
	
	// Inserta las Secuencias
	count = await state.db.collection("sequence").count();
	if (!count)
	await state.db.collection("sequence").insert(sequences);
	console.log('[*] Other Unicorn stuffs done!');

	process.exit();
}