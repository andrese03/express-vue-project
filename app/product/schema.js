const ProductCodeSchema = {
	"id": "/ProductCodeSchema",
	"type": "object",
	"properties": {
		"description": {
			"type": "string",
			"required": true
		}
	}
}
const ProductSchema = {
	"id": "/Product",
	"type": "object",
	"properties": {
		"description": {
			"type": "string",
			"required": true
		},
		"price": {
			"type": "number",
			"required": true,
		},
		"quantity": {
			"type": "number",
			"required": false,
		},
		"productCode": {
			"type": "object",
			"required": true
		},
		"unitOfMeasurement": {
			"type": "object",
			"item": {
				"_id": {
					"type": "object",
					"required": true
				},
				"description": {
					"type": "string",
					"required": true
				}
			}
		}
	}
}

module.exports = {
	ProductSchema,
	ProductCodeSchema
};