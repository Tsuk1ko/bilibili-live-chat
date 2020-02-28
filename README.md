# bilibili-live-chat

![Preview](https://i.loli.net/2019/02/13/5c638e21ad91a.gif)

这是一个非常简单的，无后端仿 YouTube Live Chat 的 Bilibili 直播弹幕在线展示器

主要用于 OBS，为的是在低功能需求的情况下，不依靠任何第三方软件实现弹幕/礼物展示

项目成品直接部署在 Github Pages

## 使用步骤

1. 打开 [bilivechat.moe.best](https://bilivechat.moe.best/)
2. 输入房间号，填写设置项，点击“Go!”，然后复制新页面的地址
3. 在 OBS 中添加“浏览器”来源，将地址粘贴到“URL”处，根据自己需要调整宽高数值
4. Enjoy~

## 关于“显示头像”

由于获取用户头像需要调用B站API，在浏览器中无法直接跨域，有两种解决方案

### 在线

该方案依赖于 [api.imjad.cn](https://api.imjad.cn/) 或 [json2jsonp](http://json2jsonp.com)，您无需进行任何额外操作，但**不建议在弹幕量大的场景下使用**

### 本地

这个功能依赖于本地运行的服务，即项目中的`src/faceService.js`

-------------------

如果你是 Windows 用户，你可以直接使用打包好的可执行文件而不必 clone 本项目，下载后双击运行即可，可最小化到任务栏托盘  
下载点：[Github](https://github.com/Tsuk1ko/bilibili-live-chat/releases/download/v1.1.1/BilibiliFaceService.exe) / [OneDrive](https://files.lolico.moe/show/my%20project/BilibiliFaceService.exe)

该可执行文件的本质是一个自解压程序，执行后会将一个 C# 写的简单 GUI 程序和 pkg 打包`src/faceService.js`生成的程序解压到 Windows 临时目录并执行，因为是临时花了个把小时现学 C# 写的一个辅助性质的 GUI 因此没有开源，如果你对此不放心你可以使用下面所述的方式

-------------------

你也可以自行安装 Node.js，然后

```bash
git clone https://github.com/Tsuk1ko/bilibili-live-chat.git
cd bilibili-live-chat
npm i
npm start
```

## 测试注意事项

### 直播间号

小于 1000 的直播间号都是由B站预留并后期人为分配的，并不是真正的直播间号，所以必须使用原直播间号才能正确连接这部分直播间

得到原直播间号的方法是打开UP主的空间，直接查看空间右侧直播间的链接得到直播间号

## 感谢

[std4453/bilibili-danmaku-client](https://github.com/std4453/bilibili-danmaku-client)

如果有好的意见和建议，欢迎提出 :>
