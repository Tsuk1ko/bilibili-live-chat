const $ = require('jquery');
const Qs = require('qs');
const Axios = require('axios');

let faceCache = new Proxy(
	{},
	{
		set: function(target, key, value, receiver) {
			console.log(`[face] ${key.padEnd(9)} ${value}`);
			return Reflect.set(target, key, value, receiver);
		},
	}
);
let facePromise = {};

function getFace(uid) {
	return faceCache[uid];
}

function setFace(uid, url) {
	faceCache[uid] = url;
}

function existFace(uid) {
	if (!faceCache[uid]) return false;
	if (Math.floor(new Date().getTime() / 86400000) - faceCache[uid].d > 7) return false;
	return true;
}

function tryGetFace(uid, tryTimes, func) {
	if (facePromise[uid]) return;
	if (tryTimes <= 0) facePromise[uid] = null;
	facePromise[uid] = func()
		.then(url => {
			setFace(uid, url);
			$(`.author-face[author-uid="${uid}"]`).css('background-image', `url(${getFace(uid)})`);
		})
		.catch(() => {
			facePromise[uid] = null;
			tryGetFace(uid, tryTimes - 1);
		});
}

function json2jsonp2json(url) {
	let q = Qs.stringify({
		url,
		callback: '_cb',
	});
	return Axios.get(`https://json2jsonp.com/?${q}`).then(ret => JSON.parse(/^_cb\((.*)\)$/.exec(ret.data)[1]));
}

function getFaceByJson2jsonp(uid) {
	tryGetFace(uid, 5, () => json2jsonp2json(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(json => json.data.face));
}

function getFaceByImjad(uid) {
	tryGetFace(uid, 5, () => Axios.get(`https://api.imjad.cn/bilibili/v2/?get=space&vmid=${uid}&pagesize=1`).then(ret => ret.data.data.card.face));
}

function getFaceDirectly(uid) {
	tryGetFace(uid, 5, () => Axios.get(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(ret => ret.data.data.face));
}

module.exports = {
	getFace,
	setFace,
	existFace,
	getFaceByJson2jsonp,
	getFaceByImjad,
	getFaceDirectly,
};
