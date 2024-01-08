# Bilibili Live Chat

![Preview](https://i.loli.net/2020/06/20/vXuZKCq396co2HO.gif)

这是一个无后端的，仿 YouTube Live Chat 的，箱都不用开就能食用的 Bilibili 直播弹幕姬

主要用于 OBS，为的是在低功能需求的情况下，不依靠任何第三方本地软件实现弹幕和礼物的展示

老版本在 `v1` 分支，新版本是使用 Vue 3 重构的版本，并增加了一些新特性，成品直接部署在 Github Pages

## 食用步骤

1. 打开 [blc.lolicon.app](https://blc.lolicon.app/)
2. 输入房间号，填写设置项，点击“Go!”，然后复制新页面的地址
3. 在 OBS 中添加“浏览器”来源，将地址粘贴到“URL”处，根据自己需要调整宽高和缩放
4. Enjoy~

## 其他说明

### 连接模式

B站在2023年7月左右开始对游客模式下的直播弹幕进行用户名打码、限流等操作，如果需要正常使用有两种方法

1. 在“普通模式”下额外提供 [live.bilibili.com](https://live.bilibili.com/) 的 cookie，**可以连接任意直播间**
2. 【推荐】使用“开放平台”模式，需要注册 Bilibili 开放平台个人开发者并提供一些参数，**只能连接自己的直播间**

#### 普通模式

该模式若未提供 cookie 则为游客身份连接，会出现收到的弹幕用户名被打码且随机限流（部分弹幕收不到）的情况

若提供 [live.bilibili.com](https://live.bilibili.com/) 的 cookie，则会使用该 cookie 调用B站 API 获取直播弹幕连接 token

支持手机 APP 扫码登录（仅限本项目官方站点）（[隐私声明](#隐私声明)）

> [!NOTE]  
> 由于需要发送 cookie，因此无论是否开启跨域模式，调用该 API 都需要依赖反代服务（详见[跨域模式](#跨域模式)）

#### 开放平台

该模式只能连接自己的直播间，但为 Bilibili 官方开放的连接方式，因此更推荐使用

1. 前往开放平台注册个人开发者（[注册地址](https://open-live.bilibili.com/open-register-form/personal)），提交注册后需要等待审核通过
2. 前往[创作者服务中心](https://open-live.bilibili.com/open-manage)-我的项目，随意创建一个项目，点进项目拿到**项目ID**
3. 前往[创作者服务中心](https://open-live.bilibili.com/open-manage)-个人资料，拿到 **access_key_id** 和 **access_key_secret**
4. 前往[我的直播间-开播设置](https://link.bilibili.com/p/center/index/#/my-room/start-live)，开始直播后拿到**身份码**，该码不会改变，拿到即可

### 跨域模式

B站 API 无法被跨域调用，若不开启跨域模式，则会使用反代服务（[隐私声明](#隐私声明)）

若在 OBS 使用，则推荐开启跨域模式，方法如下：

任何基于 Chromium 的浏览器（例如 OBS Browser 和 Chrome）都可以通过添加 `--disable-web-security` 启动参数来禁用网页安全机制，此时可以开启“跨域模式”选项，几乎所有B站 API 将被直接跨域调用（需要 cookie 的除外），这样就不需要依赖反代服务

示例：

- OBS：直接在启动的快捷方式后追加该参数，然后通过快捷方式启动即可  
  ![obs](https://i.loli.net/2020/06/20/QkXOfoTalnpAvt3.png)
- Chrome：和 OBS 同理，不过必须额外添加一个  `--user-data-dir` 参数来指定用户目录，随意新建一个空文件夹来指定即可  
  该操作看上去十分麻烦，实则是 Chrome 的一个安全措施，因为**禁用网页安全机制是危险行为，日常使用时千万别这么做**  
  ![chrome](https://s2.loli.net/2023/09/24/KL8UkX93p2ZdYSe.png)

其他内核的浏览器可以自行搜索相应参数来禁用网页安全机制

### 显示头像

> 已支持从弹幕信息中获取头像，不再需要调用 API  
> 不过普通模式下可能没有头像，不知道为什么B站又不提供 `dm_v2` 了

头像加载机制：

- 获取到头像后，图片会被预加载，加载完毕或超时（5 秒）后弹幕才会被插入弹幕列表
- 非 GIF 头像会优先加载小头像（48x48）以节省流量，若首包到达时间超过 2 秒（B站 COS 图片压缩处理卡了，偶尔可能发生），则会回退为加载完整大小的头像图片

## 隐私声明

本项目官方站点 [blc.lolicon.app](https://blc.lolicon.app/) 会额外使用到以下两个本人开源并部署在公共平台上的服务：

1. B站API反向代理服务 [Tsuk1ko/blc-proxy](https://github.com/Tsuk1ko/blc-proxy) 部署于 Cloudflare Workers
2. B站扫码登录服务 [Tsuk1ko/bilibili-qr-login](https://github.com/Tsuk1ko/bilibili-qr-login) 部署于 [HuggingFace](https://huggingface.co/spaces/Mashir0/bilibili-qr-login)

本站及上述服务不会收集任何信息，若不信任请勿在【关闭跨域模式】或【在普通连接模式下提供 cookie】的情况下使用本项目及【扫码登录】功能

## Project setup

```bash
yarn install
```

### Compiles and hot-reloads for development

```bash
yarn serve
```

### Compiles and minifies for production

```bash
yarn build
```

### Lints and fixes files

```bash
yarn lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
