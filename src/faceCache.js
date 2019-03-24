const $ = require('jquery');
const Qs = require('qs');
const Axios = require('axios');

let saveFaceRunning = false;
let faceCache = new Proxy(JSON.parse(localStorage.getItem('faces')) || {}, {
	set: function (target, key, value, receiver) {
		console.log(`[face] ${key.padEnd(9)} ${value.t}`);
		if (!saveFaceRunning) saveFaceRunning = setTimeout(() => {
			localStorage.setItem('faces', JSON.stringify(faceCache));
			saveFaceRunning = false;
		}, 10000);
		return Reflect.set(target, key, value, receiver);
	}
});
let facePromise = {};

function faceGetTail(url) {
	return /[^\/]+$/.exec(url)[0];
}

function faceObj(url) {
	return {
		t: faceGetTail(url),
		d: Math.floor(new Date().getTime() / 86400000)
	};
}

function getFace(uid) {
	let tail = faceCache[uid].t;
	if (tail == 'noface.gif') return 'http://static.hdslb.com/images/member/noface.gif';
	return `http://i${uid%4}.hdslb.com/bfs/face/${tail}`;
}

function setFace(uid, url) {
	faceCache[uid] = faceObj(url);
}

function existFace(uid) {
	if (!faceCache[uid]) return false;
	if (Math.floor(new Date().getTime() / 86400000) - faceCache[uid].d > 7) return false;
	return true;
}

function tryGetFace(uid, tryTimes, func) {
	if (facePromise[uid]) return;
	if (tryTimes <= 0) facePromise[uid] = null;
	facePromise[uid] = func().then(url => {
		faceCache[uid] = faceObj(url);
		$(`.author-face[author-uid="${uid}"]`).css('background-image', `url(${getFace(uid)})`);
	}).catch(() => {
		facePromise[uid] = null;
		tryGetFace(uid, tryTimes - 1);
	});
}

function json2jsonp2json(url) {
	let q = Qs.stringify({
		url,
		callback: '_cb'
	});
	return Axios.get(`https://json2jsonp.com/?${q}`).then(ret => JSON.parse(/^_cb\((.*)\)$/.exec(ret.data)[1]));
}

function getFaceByJson2jsonp(uid) {
	tryGetFace(uid, 5, () => json2jsonp2json(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(json => json.data.face));
}

function getFaceByImjad(uid) {
	tryGetFace(uid, 5, () => Axios.get(`https://api.imjad.cn/bilibili/v2/?get=space&vmid=${uid}&pagesize=1`).then(ret => ret.data.data.card.face));
}

module.exports = {
	getFace,
	setFace,
	existFace,
	getFaceByJson2jsonp,
	getFaceByImjad
};
