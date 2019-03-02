# bilibili-live-chat

![Preview](https://i.loli.net/2019/02/13/5c638e21ad91a.gif)

这是一个仿 YouTube Live Chat 的 Bilibili 直播弹幕展示器，主要用于 OBS

## 使用步骤

1. 打开 [bilivechat.moe.best](https://bilivechat.moe.best/)
2. 输入房间号，填写设置项，点击“Go!”，然后复制新页面的地址
3. 在 OBS 中添加“浏览器”来源，将地址粘贴到“URL”处，根据自己需要调整宽高数值
4. Enjoy~

## 关于“显示头像”

由于获取用户头像需要调用B站API，在浏览器中无法直接跨域，有两种解决方案

### 在线

该方案依赖于 [json2jsonp](http://json2jsonp.com)，您无需进行任何额外操作，但**不建议在弹幕量大的场景下使用**

### 本地

因此这个功能依赖于本地运行的服务，即项目中的`src/faceService.js`，启动该服务后即可勾选“显示头像”以展示弹幕发送者头像

如果你是 Windows 用户，你可以直接使用该打包好的可执行文件，下载后双击运行即可，可最小化到任务栏托盘  
下载点：[Github](https://github.com/Tsuk1ko/bilibili-live-chat/releases/download/v1.1.1/BilibiliFaceService.exe) / [OneDrive](https://files.lolico.moe/show/my%20project/BilibiliFaceService.exe)

或者你也可以自行安装 Node.js，然后

```bash
git clone https://github.com/Tsuk1ko/bilibili-live-chat.git
cd bilibili-live-chat
npm i
npm start
```

## 各种坑

### 小于 1000 的直播间号

小于 1000 的直播间号都是由B站预留并后期人为分配的，并不是真正的直播间号，所以必须使用原直播间号才能正确连接这部分直播间

得到原直播间号的方法是打开UP主的空间，直接查看空间右侧直播间的链接得到直播间号

### B站弹幕服务包含的信息过少

仅与弹幕服务器通信无法识别弹幕是否由主播发出，因此必须提供 UID 才可以实现将主播名字以不同颜色标识的功能

## TODO

- [x] 礼物合并
- [ ] 弹幕频率限制
- [ ] 样式生成器

## 感谢

[std4453/bilibili-danmaku-client](https://github.com/std4453/bilibili-danmaku-client)

如果有好的意见和建议，欢迎提出 :>
