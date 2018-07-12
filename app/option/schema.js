const RoleSchema = {
	"id": "/Option",
	"type": "object",
	"properties": {
		"type": {
			"type": "object",
			"required": true
		},
		"label": {
			"type": "string",
			"required": true
		},
		"value": {
			"type": "string",
			"required": true
		},
		"parent": {
			"type": "number",
			"required": false
		},
		"icon": {
			"type": "string",
			"required": false
		}
	}
}

module.exports = RoleSchema;