const DanmakuClient = require('bilibili-danmaku-client');
const $ = require('jquery');
const Qs = require('qs');

$(document).ready(() => {
	let {
		room,
		withFace
	} = Qs.parse(window.location.hash.substr(1));

	room = parseInt(room);
	withFace == (withFace == 'true');
	if (isNaN(room)) {
		$('body').html(`<p style="margin:16px">参数有误</p>`);
		return;
	}

	const client = new DanmakuClient(room);
	client.start();

	let $main = $('#main');
	let queue = [];

	function handleQueue() {
		let sleep = 100;
		let len = queue.length;
		if (len > 0) {
			(queue.shift())();
			$main[0].scrollTop = $main[0].scrollHeight;
			let s = 1000 / len;
			if (s < sleep) sleep = s;
		}
		setTimeout(handleQueue, sleep);
	}

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
			name
		}
	}) {
		let face = '';
		if (withFace) face = `<div class="author-face" style="background-image:url(http://127.0.0.1:23233/${uid})"></div>`;
		queue.push(() => $main.append(`<div class="danmaku-item">${face}<div class="content"><span class="author-name colon">${name}</span><span class="message">${content}</span></div></div>`));
	}

	function onGift({
		gift,
		num,
		sender: {
			uid,
			name
		}
	}) {
		let face = '';
		if (withFace) face = `<div class="author-face" style="background-image:url(http://127.0.0.1:23233/${uid})"></div>`;
		queue.push(() => $main.append(`<div class="danmaku-item">${face}<div class="content"><span class="message">感谢</span><span class="author-name">${name}</span><span class="message">赠送的${num}个</span><span class="gift">${gift.name}</span></div></div>`));
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

	handleQueue();
});
