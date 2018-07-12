// const schema = {
	// 	"id": "/Test",
	// 	"type": "object",
	// 	"properties": {
	// 		"description": {
	// 			"type": "string",
	// 			"required": true
	// 		}
	// 	}
	// }
	// const collection = 'test';
	// const uniqueProperties = ['description'];
    // class Test extends MongoRepository {
	// 	constructor() {
	// 		super(db, collection, schema, uniqueProperties);
	// 	}
    // }

	// let instance = new Test();

	// let ra = await instance.insert({ description: 'Test' }, { _id: 1, username: 'andrese03', profile: { firstName: 'Andres', lastName: 'Encarnacion' } });

	// let options = 
   	// [Find|Count|Distinct] by Selector, todos los parametros son opcionales (excepto search, que requiere fields)
    // {
    //  "selector": {
    //    "owner._id": 2
    //  },
    //  "search": "Test",
    //  "distinct": "description",
    //  "fields": ["_id", "description"],
    //  "limit": 10,
    //  "skip": 0,
    //  "sort": {"description":1},
    //  "date": [
    //    {"field": "createdDate", "from":"2018-02-17T04:00:00.000Z", "to": "2018-02-18T04:00:00.000Z"},
    //    {"field": "birthDate", "from":"2016-06-08T04:00:00.000Z", "to": "2016-06-09T04:00:00.000Z"}
	//  ]
	// }

	// let id = '5a88335e23726306b04550ae';

	// let ra = await instance.findById(id);

	// ra.description = 'Test 3 Updated Yeah';

	// let ra = await instance.find(options);

	// let ra = await instance.count(options);

	// let ra = await instance.distinct(options);

	// ra = await instance.update(id, ra);

	// ra = await instance.delete(id, ra);

	// console.log('RAAA!');	
	// console.log(ra);