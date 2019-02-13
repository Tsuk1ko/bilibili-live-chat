const Http = require('http');
const Axios = require('axios');

let faces = [];

console.log('Service start');

Http.createServer(async (request, response) => {
	let search = /(?<=^\/)[0-9]+$/.exec(request.url);
	if (!search) {
		response.end();
		return;
	}

	let uid = search[0];
	if (faces[uid]) {
		console.log(`[cached] ${uid}\t${faces[uid]}`);
	} else {
		faces[uid] = await Axios.get(`http://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(ret => ret.data.data.face);
		console.log(`[new] ${uid}\t${faces[uid]}`);
	}

	response.writeHead(301, {
		'Location': faces[uid]
	});
	response.end();
}).listen(23233);
