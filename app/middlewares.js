module.exports = function (app) {
	// var db = app.get('db');

	// app.get('/lists', utils.getLists()); // Funcion para obtener las listas

	// app.use('*', function (req, res, next) {
	// 	res.status(404).json(new utils.BadResponse(`Wait what? 'The url you're trying to reach doesn't exist.`));
	// });

	// app.use(function (err, req, res, next) {
	//     // Objeto de Error
	//     var _error = {
	//       name: err.name,
	//       message: err.message,
	//       stack: err.stack,
	//       date: new Date()
	//     }

	//     res.status(500).json(_error);

	//     console.log('[*] Error: ', _error.message);
	//     console.log('[*] Stack: ', _error.stack);

	//     // El registro de error se guarda dentro de un archivo
	//     db.collection('log').insert(_error, function (err, document) {
	//       if (!err)
	//         return;
	//       var fs = require('fs');
	//       var filePath = __dirname + "/log/log-" + new Date().getFullYear() + "-" + (parseInt(new Date().getMonth()) + 1) + "-" + new Date().getDate() + ".txt";
	//       var txtLineError = _error.date.toISOString() + "|" + _error.message + "|" + _error.stack + "\n";
	//       fs.appendFile(filePath, txtLineError, function (document) {
	//         console.log("[*] Log guardado en " + filePath);
	//       });
	//     });

	// })
}