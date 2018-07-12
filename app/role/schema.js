const RoleSchema = {
	"id": "/Role",
	"type": "object",
	"properties": {
		"name": {
			"type": "string",
			"required": true
		},
		"options": {
			"type": "array",
			"required": true
		},
		"active": {
			"type": "boolean",
			"required": true
		},
	}
}

module.exports = RoleSchema;