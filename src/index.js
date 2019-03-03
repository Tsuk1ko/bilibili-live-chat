const DanmakuClient = require('bilibili-danmaku-client');
const $ = require('jquery');
const Qs = require('qs');
const Axios = require('axios');
const shuffle = require('shuffle-array');

$(document).ready(() => {
	//参数
	let {
		room,
		face,
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
	if (typeof withFace != 'undefined') face = 'local';
	if (typeof face == 'undefined') face = 'false';
	let faceCache = {};

	//UID
	aUID = parseInt(aUID);
	if (isNaN(aUID)) {
		aUID = false;
		json2jsonp2json(`https://api.live.bilibili.com/live_user/v1/UserInfo/get_anchor_in_room?roomid=${room}`).then(({
			data: {
				info: {
					face,
					uid
				}
			}
		}) => {
			aUID = uid;
			faceCache[uid] = http2https(face);
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

	function json2jsonp2json(url) {
		let q = Qs.stringify({
			url,
			callback: '_cb'
		});
		return Axios.get(`https://json2jsonp.com/?${q}`).then(ret => JSON.parse(/^_cb\((.*)\)$/.exec(ret.data)[1]));
	}

	function http2https(url) {
		return url.replace('http://', 'https://');
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

			switch (face) {
				case 'local':
					let faceURL = (typeof faceCache[uid] == 'string') ? faceCache[uid] : `http://127.0.0.1:23233/${uid}`;
					faceHTML = `<div class="author-face" style="background-image:url(${faceURL})"></div>`;
					break;
				case 'online':
					if (!faceCache[uid]) {
						faceCache[uid] = json2jsonp2json(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(json => {
							faceCache[uid] = http2https(json.data.face);
							$(`.author-face[author-uid="${uid}"]`).css('background-image', `url(${faceCache[uid]})`);
						});
					}
					if (typeof faceCache[uid] == 'string')
						faceHTML = `<div class="author-face" style="background-image:url(${faceCache[uid]})"></div>`;
					else
						faceHTML = `<div class="author-face" author-uid="${uid}"></div>`;
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
			face: faceURL
		}
	}) {
		faceCache[uid] = http2https(faceURL);
		let faceHTML = (face == 'false') ? '' : `<div class="author-face" style="background-image:url(${faceCache[uid]})"></div>`;

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
