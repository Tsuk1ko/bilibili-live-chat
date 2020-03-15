const DanmakuClient = require('bilibili-danmaku-client');
const $ = require('jquery');
const Qs = require('qs');
const Axios = require('axios');
const shuffle = require('shuffle-array');
const FaceCache = require('./faceCache');

let danmakuQueue = [];
let danmakuQueueLimited = [];
let giftQueue = [];
let gifts = {};
let di = 0;

function json2jsonp2json(url) {
	let q = Qs.stringify({
		url,
		callback: '_cb'
	});
	return Axios.get(`https://json2jsonp.com/?${q}`).then(ret => JSON.parse(/^_cb\((.*)\)$/.exec(ret.data)[1]));
}

//参数
const _GET = Qs.parse(window.location.hash.substr(1));
console.log(_GET);
let {
	room,
	face: faceServer,
	withFace,
	aUID,
	giftComb,
	speed,
	display,
	stay
} = _GET;

//房号
room = parseInt(room);
if (isNaN(room)) {
	$('body').html(`<p style="margin:16px">参数有误</p>`);
	throw new Error('参数有误');
}

//头像
if (typeof withFace != 'undefined') faceServer = 'local'; //兼容旧版
if (typeof faceServer == 'undefined' || faceServer == 'false') faceServer = false;

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
		FaceCache.setFace(uid, face);
	});
}

//礼物合并
if (typeof giftComb == 'undefined') giftComb = false;
else {
	giftComb = parseInt(giftComb) || 5000;
	if (giftComb <= 0) giftComb = false;
}

//频率限制
speed = parseInt(speed);
if (isNaN(speed) || speed < 0) {
	speed = 0;
}

//停留时间
stay = parseFloat(stay);
if (isNaN(stay) || stay < 0) {
	stay = 0;
}

/**
 * Start
 */

const client = new DanmakuClient(room);
client.start();

let $main = $('#main');
if (display == 'bottom') $main.append('<div class="danmaku-placeholder"></div>');

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

		if (faceServer) {
			if (FaceCache.existFace(uid)) faceHTML = `<div class="author-face" style="background-image:url(${FaceCache.getFace(uid)})"></div>`;
			else switch (faceServer) {
				case 'local':
					faceHTML = `<div class="author-face" style="background-image:url(http://127.0.0.1:23233/${uid})"></div>`;
					break;
				default:
					faceHTML = `<div class="author-face" author-uid="${uid}"></div>`;
					switch (faceServer) {
						case 'online':
							FaceCache.getFaceByImjad(uid);
							break;
						case 'online2':
							FaceCache.getFaceByJson2jsonp(uid);
							break;
						case 'direct':
							FaceCache.getFaceDirectly(uid);
							break;
					}
			}
		}

		let index = di++;

		$main.append(`<div class="danmaku-item" index="${index}">${faceHTML}<div class="content"><span class="author-name${aUID==uid?' anchor':''}${isOwner?' owner':''} colon">${name}</span><span class="message">${content}</span></div></div>`);

		if (stay > 0) setTimeout(() => $(`.danmaku-item[index=${index}]`).addClass('op-0'), stay * 1000);
	});
}

function onGift({
	gift,
	num,
	sender: {
		uid,
		name,
		isOwner,
		face
	}
}) {
	FaceCache.setFace(uid, face);
	let faceHTML = faceServer ? `<div class="author-face" style="background-image:url(${FaceCache.getFace(uid)})"></div>` : '';

	let appednHtml = (giftNum, i) => $main.append(`<div class="danmaku-item" index="${i}">${faceHTML}<div class="content"><span class="message">感谢</span><span class="author-name${isOwner?' owner':''}">${name}</span><span class="message">赠送的${giftNum}个</span><span class="gift">${gift.name}</span></div></div>`);

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
			giftQueue.push(() => {
				let index = di++;
				appednHtml(total, index);
				if (stay > 0) setTimeout(() => $(`.danmaku-item[index=${index}]`).addClass('op-0'), stay * 1000);
			});
		}, giftComb);
	} else giftQueue.push(() => {
		let index = di++;
		appednHtml(num, index);
		if (stay > 0) setTimeout(() => $(`.danmaku-item[index=${index}]`).addClass('op-0'), stay * 1000);
	});
}

//清除不需要显示的弹幕
setInterval(() => {
	$('.danmaku-item').each(function() {
		let $this = $(this);
		if ($this.offset().top < -100) $this.remove();
		else if (!$this.hasClass('op-0') && $this.offset().top < 0) $this.addClass('op-0');
	});
}, 1000);

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
