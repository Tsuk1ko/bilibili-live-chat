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
		console.log(` cache | ${fixed(uid,9)} | ${faces[uid]}`);
	} else {
		faces[uid] = await Axios.get(`http://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(ret => ret.data.data.face.replace('http://', 'https://'));
		console.log(`  new  | ${fixed(uid,9)} | ${faces[uid]}`);
	}

	response.writeHead(302, {
		'Location': faces[uid]
	});
	response.end();
}).listen(23233);

function fixed(str, bit) {
	let len = bit - str.length;
	while (len > 0) {
		str += ' ';
		len--;
	}
	return str;
}
