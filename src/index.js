const DanmakuClient = require('bilibili-danmaku-client');
const $ = require('jquery');
const Qs = require('qs');
const Axios = require('axios');
const shuffle = require('shuffle-array');

function json2jsonp2json(url) {
	let q = Qs.stringify({
		url,
		callback: '_cb'
	});
	return Axios.get(`https://json2jsonp.com/?${q}`).then(ret => JSON.parse(/^_cb\((.*)\)$/.exec(ret.data)[1]));
}

function faceGetTail(url) {
	return /[^\/]+$/.exec(url)[0];
}

function faceObj(url) {
	return {
		t: faceGetTail(url),
		d: Math.floor(new Date().getTime() / 86400000)
	};
}

$(document).ready(() => {
	//参数
	let {
		room,
		face: faceServer,
		withFace,
		aUID,
		giftComb,
		speed
	} = Qs.parse(window.location.hash.substr(1));

	//房号
	room = parseInt(room);
	if (isNaN(room)) {
		$('body').html(`<p style="margin:16px">参数有误</p>`);
		return;
	}

	//头像
	if (typeof withFace != 'undefined') faceServer = 'local';
	if (typeof faceServer == 'undefined') faceServer = 'false';
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

	function getFace(uid) {
		let tail = faceCache[uid].t;
		if (tail == 'noface.gif') return 'http://static.hdslb.com/images/member/noface.gif';
		return `http://i${uid%4}.hdslb.com/bfs/face/${tail}`;
	}

	function existFace(uid) {
		if (!faceCache[uid]) return false;
		if (Math.floor(new Date().getTime() / 86400000) - faceCache[uid].d > 7) return false;
		return true;
	}

	//UID
	aUID = parseInt(aUID);
	if (isNaN(aUID)) {
		let anchors = JSON.parse(localStorage.getItem('anchors'));
		if (!anchors) anchors = {};
		if (anchors[room]) aUID = anchors[room];
		else json2jsonp2json(`https://api.live.bilibili.com/live_user/v1/UserInfo/get_anchor_in_room?roomid=${room}`).then(({
			data: {
				info: {
					face,
					uid
				}
			}
		}) => {
			aUID = uid;
			anchors[room] = uid;
			console.log(`[anchor] ${uid}`);
			localStorage.setItem('anchors', JSON.stringify(anchors));
			faceCache[uid] = faceObj(face);
		});
	}

	//礼物合并
	if (typeof giftComb == 'undefined') giftComb = false;
	else giftComb = parseInt(giftComb) || 5000;

	//频率限制
	speed = parseInt(speed);
	if (isNaN(speed)) {
		speed = 0;
	}

	const client = new DanmakuClient(room);
	client.start();

	let $main = $('#main');
	let danmakuQueue = [];
	let danmakuQueueLimited = [];
	let giftQueue = [];
	let gifts = {};

	//清除不需要显示的弹幕
	setInterval(() => {
		$('.danmaku-item').each(function () {
			let $this = $(this);
			if ($this.offset().top < 0) $this.css('opacity', 0);
			if ($this.offset().top < -100) $this.remove();
		});
	}, 1000);

	function tryGetFace(uid, tryTimes) {
		if (facePromise[uid]) return;
		if (tryTimes <= 0) facePromise[uid] = null;
		facePromise[uid] = json2jsonp2json(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(json => {
			faceCache[uid] = faceObj(json.data.face);
			$(`.author-face[author-uid="${uid}"]`).css('background-image', `url(${getFace(uid)})`);
		}).catch(() => {
			facePromise[uid] = null;
			tryGetFace(uid, tryTimes - 1);
		});
	}

	function onDanmaku({
		content,
		sender: {
			uid,
			name,
			isOwner
		}
	}) {
		danmakuQueue.push(() => {
			let faceHTML = '';

			switch (faceServer) {
				case 'local':
					let faceURL = (typeof faceCache[uid] == 'string') ? faceCache[uid] : `http://127.0.0.1:23233/${uid}`;
					faceHTML = `<div class="author-face" style="background-image:url(${faceURL})"></div>`;
					break;
				case 'online':
					if (existFace(uid)) {
						faceHTML = `<div class="author-face" style="background-image:url(${getFace(uid)})"></div>`;
					} else {
						tryGetFace(uid, 5);
						faceHTML = `<div class="author-face" author-uid="${uid}"></div>`;
					}
					break;
			}

			$main.append(`<div class="danmaku-item">${faceHTML}<div class="content"><span class="author-name${aUID==uid?' anchor':''}${isOwner?' owner':''} colon">${name}</span><span class="message">${content}</span></div></div>`);
		});
	}

	function onGift({
		gift,
		num,
		sender: {
			uid,
			name,
			face
		}
	}) {
		faceCache[uid] = faceObj(face);
		let faceHTML = (faceServer == 'false') ? '' : `<div class="author-face" style="background-image:url(${getFace(uid)})"></div>`;

		if (giftComb) {
			if (!gifts[uid]) gifts[uid] = {};

			if (gifts[uid][gift.id]) {
				gifts[uid][gift.id].total += num;
				clearTimeout(gifts[uid][gift.id].timeout);
			} else gifts[uid][gift.id] = {
				total: num
			};

			gifts[uid][gift.id].timeout = setTimeout(() => {
				let total = gifts[uid][gift.id].total;
				gifts[uid][gift.id] = false;
				giftQueue.push(() => $main.append(`<div class="danmaku-item">${faceHTML}<div class="content"><span class="message">感谢</span><span class="author-name">${name}</span><span class="message">赠送的${total}个</span><span class="gift">${gift.name}</span></div></div>`));
			}, giftComb);
		} else giftQueue.push(() => $main.append(`<div class="danmaku-item">${faceHTML}<div class="content"><span class="message">感谢</span><span class="author-name">${name}</span><span class="message">赠送的${num}个</span><span class="gift">${gift.name}</span></div></div>`));
	}

	client.on('event', ({
		name,
		content
	}) => {
		switch (name) {
			case 'danmaku':
				onDanmaku(content);
				break;
			case 'gift':
				onGift(content);
				break;
		}
	});

	//弹幕进入错开效果
	function handleQueue(queue) {
		let sleep = 100;
		let len = queue.length;
		if (len > 0) {
			(queue.shift())();
			$main[0].scrollTop = $main[0].scrollHeight;
			let s = 1000 / len;
			if (s < sleep) sleep = s;
		}
		setTimeout(() => handleQueue(queue), sleep);
	}

	//频率限制
	function handleQueueLimited(queue, queueLimited) {
		setInterval(() => {
			let temp = queue.splice(0, queue.length);
			if (temp.length > speed) {
				//随机挑选
				let indexs = shuffle.pick(Array.from(temp, (v, k) => k), {
					'picks': speed
				});
				if (typeof indexs == 'number') indexs = [indexs];
				else indexs.sort();
				for (let index of indexs) {
					queueLimited.push(temp[index]);
				}
			} else queueLimited.push(...temp);
		}, 1000);
	}

	if (speed > 0) {
		handleQueueLimited(danmakuQueue, danmakuQueueLimited);
		handleQueue(danmakuQueueLimited);
	} else handleQueue(danmakuQueue);
	handleQueue(giftQueue);
});
