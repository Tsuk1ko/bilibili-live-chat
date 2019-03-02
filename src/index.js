const DanmakuClient = require('bilibili-danmaku-client');
const $ = require('jquery');
const Qs = require('qs');
const Axios = require('axios');

$(document).ready(() => {
	//参数
	let {
		room,
		face,
		withFace,
		aUID,
		giftComb
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
	if (isNaN(aUID)) aUID = false;

	//礼物合并
	if (typeof giftComb == 'undefined') giftComb = false;
	else giftComb = parseInt(giftComb) || 5000;

	const client = new DanmakuClient(room);
	client.start();

	let $main = $('#main');
	let queue = [];
	let gifts = {};

	//清除不需要显示的弹幕
	setInterval(() => {
		$('.danmaku-item').each(function () {
			let $this = $(this);
			if ($this.offset().top < 0) $this.css('opacity', 0);
			if ($this.offset().top < -100) $this.remove();
		});
	}, 1000);

	function onDanmaku({
		content,
		sender: {
			uid,
			name,
			isOwner
		}
	}) {
		let faceHTML = '';

		switch (face) {
			case 'local':
				let faceURL = (typeof faceCache[uid] == 'string') ? faceCache[uid] : `http://127.0.0.1:23233/${uid}`;
				faceHTML = `<div class="author-face" style="background-image:url(${faceURL})"></div>`;
				break;
			case 'online':
				if (!faceCache[uid]) {
					faceHTML = `<div class="author-face" author-uid="${uid}"></div>`;
					let q = Qs.stringify({
						url: `http://api.bilibili.com/x/space/acc/info?mid=${uid}`,
						callback: '_cb'
					});
					faceCache[uid] = Axios.get(`https://json2jsonp.com/?${q}`).then(ret => {
						let json = JSON.parse(/^_cb\((.*)\)$/.exec(ret.data)[1]);
						faceCache[uid] = json.data.face;
						$(`.author-face[author-uid="${uid}"]`).css('background-image', `url(${json.data.face})`);
					});
				}
				if (typeof faceCache[uid] == 'string')
					faceHTML = `<div class="author-face" style="background-image:url(${faceCache[uid]})"></div>`;
				break;
		}

		queue.push(() => $main.append(`<div class="danmaku-item">${faceHTML}<div class="content"><span class="author-name${aUID==uid?' anchor':''}${isOwner?' owner':''} colon">${name}</span><span class="message">${content}</span></div></div>`));
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
		let faceHTML = (face == 'false') ? '' : `<div class="author-face" style="background-image:url(${face})"></div>`;

		faceCache[uid] = face;

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
				queue.push(() => $main.append(`<div class="danmaku-item">${faceHTML}<div class="content"><span class="message">感谢</span><span class="author-name">${name}</span><span class="message">赠送的${total}个</span><span class="gift">${gift.name}</span></div></div>`));
			}, giftComb);
		} else queue.push(() => $main.append(`<div class="danmaku-item">${face}<div class="content"><span class="message">感谢</span><span class="author-name">${name}</span><span class="message">赠送的${num}个</span><span class="gift">${gift.name}</span></div></div>`));
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
	(function handleQueue() {
		let sleep = 100;
		let len = queue.length;
		if (len > 0) {
			(queue.shift())();
			$main[0].scrollTop = $main[0].scrollHeight;
			let s = 1000 / len;
			if (s < sleep) sleep = s;
		}
		setTimeout(handleQueue, sleep);
	})();
});
