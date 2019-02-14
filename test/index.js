const DanmakuClient = require('bilibili-danmaku-client');
const client = new DanmakuClient(3806710);
client.start();
client.on('event', e => {
	console.log(e)
});
