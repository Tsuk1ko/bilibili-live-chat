const DanmakuClient = require('bilibili-danmaku-client');
const $ = require('jquery');
const Qs = require('qs');

$(document).ready(() => {
	//参数
	let {
		room,
		withFace,
		giftComb
	} = Qs.parse(window.location.hash.substr(1));

	//房号
	room = parseInt(room);
	if (isNaN(room)) {
		$('body').html(`<p style="margin:16px">参数有误</p>`);
		return;
	}

	//头像
	withFace = (typeof withFace != "undefined");

	//礼物合并
	if (typeof giftComb == "undefined") giftComb = false;
	else giftComb = parseInt(giftComb) || 5000;

	const client = new DanmakuClient(room);
	client.start();

	let $main = $('#main');
	let queue = [];
	let gifts = {};

	//清除不需要显示的弹幕
	setInterval(() => {
		$('.danmaku-item').each(function () {
			if ($(this).offset().top < 0) $(this).css('opacity', 0);
			if ($(this).offset().top < -100) $(this).remove();
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
		let face = withFace ? `<div class="author-face" style="background-image:url(http://127.0.0.1:23233/${uid})"></div>` : '';
		queue.push(() => $main.append(`<div class="danmaku-item">${face}<div class="content"><span class="author-name${isOwner?' owner':''} colon">${name}</span><span class="message">${content}</span></div></div>`));
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
		face = withFace ? `<div class="author-face" style="background-image:url(${face})"></div>` : '';

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
				queue.push(() => $main.append(`<div class="danmaku-item">${face}<div class="content"><span class="message">感谢</span><span class="author-name">${name}</span><span class="message">赠送的${total}个</span><span class="gift">${gift.name}</span></div></div>`));
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
