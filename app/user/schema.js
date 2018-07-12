const UserSchema = {
	id: '/User',
	type: 'object',
	properties: {
		username: {
			type: 'string',
			required: true
		},
		password: {
			type: 'string',
			required: true
		},
		email: {
			type: 'string',
			required: false
		},
		role: {
			type: 'object',
			item: {
				_id: {
					type: 'object',
					required: true
				},
				description: {
					type: 'string',
					required: true
				},
				options: {
					type: 'array',
					required: false
				}
			}
		},
		active: {
			type: 'boolean',
			required: true
		},
		profile: {
			type: 'object',
			item: {
				firstName: {
					type: 'string',
					required: true
				},
				lastName: {
					type: 'string',
					required: true
				}
			}
		},
		employeeCode: {
			type: 'string',
			required: true
		},
		jobTitle: {
			type: 'string',
			required: true
		}
	}
};

module.exports = UserSchema;
