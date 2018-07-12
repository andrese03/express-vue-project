
class HTTPError extends Error {
	constructor (status,...args) {
		super(...args);
		Error.captureStackTrace(this, HTTPError);
		this.status = status;
	}
}

module.exports = {
	HTTPError
}