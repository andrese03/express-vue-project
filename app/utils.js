// TODO: ES6
const ObjectID = require('mongodb').ObjectID;
const md5 = require('md5');
const _ = require('lodash');
const lists = require('./lists');

const GoodResponse = exports.GoodResponse = function (data) {
	this.result = 'Ok';
	this.data = data;
}

const BadResponse = exports.BadResponse = function (data) {
	this.result = 'Not Ok';
	this.data = data;
}

const convertPropertiesToObjectID = exports.convertPropertiesToObjectID = (object) => {

	for (let key in object) {

		if (typeof object[key] == 'string')
			console.log(key, object[key]);

		if (object[key] && typeof object[key] == 'string' && ObjectID.isValid(object[key])) {
			object[key] = ObjectID.createFromHexString(object[key]);
			continue;
		}

		//Si es un arreglo, para cada elemento, recursivamente actualizar sus propiedades
		if (Array.isArray(object[key])) {
			for (let i in object[key]) {
				object[key][i] = convertPropertiesToObjectID(object[key][i])
			}
		}

		//Si es un objeto recursivamente actualizar sus propiedades
		if (typeof object[key] == "object") {
			console.log(key)
			object[key] = convertPropertiesToObjectID(object[key])
		}

	}
	return object;

}

const convertPropertiesToDate = exports.convertPropertiesToDate = function (object) {
	var key;
	var dateRegex = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

	for (key in object) {

		//Si es un arreglo, para cada elemento, recursivamente actualizar sus propiedades
		if (Array.isArray(object[key])) {
			for (var i in object[key]) {
				object[key][i] = convertPropertiesToDate(object[key][i])
			}
		}
		//Si es un objeto recursivamente actualizar sus propiedades
		if (typeof object[key] == "object") {
			object[key] = convertPropertiesToDate(object[key])
		}
		// Si no es ninguno de estos, pues amen
		else if (typeof object[key] == "string") {
			if (/date/.test(key.toLowerCase()) || dateRegex.test(object[key])) {
				object[key] = new Date(object[key]);

				if (isNaN(object[key])) {
					object[key] = undefined;
				}

			}
		}
	}
	return object;
};

exports.success = function (res) {
	return function (data) {
		res.status(200).json(new GoodResponse(data));
	};
}

exports.failed = function (res) {
	return function (data) {
		res.status(510).json(new BadResponse(data));
	};
}

exports.inception = function (obj, path) {
	return path.split('.').reduce(function (prev, actual) {
		return prev[actual];
	}, obj);
};

exports.clone = function (obj) {
	var _this = this;
	var copy;

	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = _this.clone(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = _this.clone(obj[attr]);
		}
		return copy;
	}

	throw new Error("Unable to copy obj! Its type isn't supported.");
}

exports.joinObjects = function (objTo, objFrom) {
	for (var i in objFrom) {
		objTo[i] = (objTo[i]) ? objTo[i] : objFrom[i];
	};
	return objTo;
}

exports.getLists = function () {
	return function (req, res) {
		var listNames = req.body.listNames || req.body || [];
		var _list = {};
		for (var key in listNames) {
			var prop = listNames[key];
			_list[prop] = lists[prop];
		}
		_list = (listNames.length) ? _list : lists;
		res.status(200).json(_list);
	};
};


exports.unauthorizedRequestHandler = function (err, req, res, next) {
	if (err.name === 'UnauthorizedError') {
		res.status(401).json(new BadResponse('invalid token'));
	}
}
