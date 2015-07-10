(function(){
	var config = {
		'ahk-exe': 'D:\\Program Files\\AutoHotkey\\AutoHotkey.exe',
		'ahk-script': (__dirname + '\\key.ahk')
	};

	var exec = require('child_process').execFile;

	var keys=["AAAA-BBBB-CCCC"];
	/* or multiples:
	[
		"AAAA-BBBB-CCCC",
		"AAAA-BBBB-CCCC",
		"AAAA-BBBB-CCCC",
		"AAAA-BBBB-CCCC",
		"AAAA-BBBB-CCCC"
	]
	*/

	console.log("fun starts");

	var execAHK = function(key){
		var executeFile = config['ahk-exe'];
		var executeArgs = [config['ahk-script'], key];

		exec(executeFile, executeArgs, function(err, data) {
			if(err)
				console.log("executeArgs, err, data:", executeArgs, err, data);
		});
	}


	keys.forEach(function(e){
		execAHK(e);
	});

})();