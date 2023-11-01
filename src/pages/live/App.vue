<template>
  <div id="custom-css" style="display: none"></div>
  <DanmakuItem v-if="errMsg" type="info" :message="errMsg" />
  <Live v-else-if="ready" v-bind="props" :live-ws-options="liveWsOptions" />
</template>

<script>
import { defineComponent, reactive, onBeforeUnmount, ref, onMounted, shallowRef } from 'vue';
import { parseProps } from '@/utils/props';
import { setCors, autoGet, corsGet } from '@/utils/request';
import { getOpenData } from '@/utils/biliOpen';

import Live from '@/components/Live';
import DanmakuItem from '@/components/DanmakuItem';

export default defineComponent({
  components: { Live, DanmakuItem },
  setup() {
    const onHashChange = () => window.location.reload();
    window.addEventListener('hashchange', onHashChange);
    onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange));

    const props = reactive(parseProps(window.location.hash));
    const liveWsOptions = shallowRef();

    const customCss = props.customCss?.trim();
    if (customCss) {
      onMounted(() => {
        const style = document.createElement('style');
        style.innerHTML = customCss;
        document.getElementById('custom-css')?.appendChild(style);
      });
    }

    const canCORS = props.cors === 'true';
    setCors(canCORS);

    const ready = ref(false);
    const errMsg = ref('');

    if (props.auth === 'open') {
      getOpenData(props.akId, props.akSecret, parseInt(props.appId), props.code)
        .then(data => {
          props.room = data.anchor_info.room_id;
          props.anchor = data.anchor_info.uid;
          liveWsOptions.value = {
            address: data.websocket_info.wss_link[0],
            authBody: JSON.parse(data.websocket_info.auth_body),
          };
          ready.value = true;
        })
        .catch(e => {
          let msg = '开放平台开启失败';
          if (canCORS) msg += '，请检查是否正确禁用了浏览器的 web security 以允许直接跨域';
          msg += `\n${e}`;
          errMsg.value = msg;
        });
    } else {
      (async () => {
        const eMsg = [];

        // 获取房间信息
        const getRoomInfoSuccess = autoGet(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${props.room}`)
          .then(({ code, msg, data: { room_id, uid } }) => {
            if (code === 0) {
              props.room = parseInt(room_id);
              props.anchor = parseInt(uid);
              return true;
            }
            eMsg.push(msg);
            return false;
          })
          .catch(e => {
            eMsg.push(`获取房间信息失败${canCORS ? '，请检查是否正确禁用了浏览器的 web security 以允许直接跨域' : ''}`);
            eMsg.push(String(e));
            return false;
          });

        if (props.cookie) {
          const buvid = /\bbuvid3=([^;]+)\b/.exec(props.cookie)?.[1];
          const uid = /\bDedeUserID=([^;]+)\b/.exec(props.cookie)?.[1];
          if (buvid && uid) {
            await corsGet(
              `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${props.room}&type=0`,
              {
                headers: { Cookie: props.cookie },
              }
            )
              .then(async ({ code, message, data: { token, host_list } }) => {
                if (!(await getRoomInfoSuccess)) return;
                if (code === 0) {
                  liveWsOptions.value = {
                    address: `wss://${host_list[0].host}/sub`,
                    authBody: {
                      uid: parseInt(uid),
                      roomid: props.room,
                      protover: 3,
                      buvid,
                      platform: 'web',
                      type: 2,
                      key: token,
                    },
                  };
                } else {
                  eMsg.push(message);
                }
              })
              .catch(e => {
                eMsg.push(
                  `获取 token 失败${canCORS ? '，请检查是否正确禁用了浏览器的 web security 以允许直接跨域' : ''}`
                );
                eMsg.push(String(e));
              });
          }
        }

        await getRoomInfoSuccess;

        if (eMsg.length) {
          errMsg.value = eMsg.join('\n');
        } else {
          ready.value = true;
        }
      })();
    }

    if (props.debug) {
      import(/* webpackIgnore: true */ 'https://fastly.jsdelivr.net/npm/vconsole/dist/vconsole.min.js').then(() => {
        new window.VConsole();
      });
    }

    return { props, ready, errMsg, liveWsOptions };
  },
});
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: transparent;
}
</style>
