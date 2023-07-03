<template>
  <div id="custom-css" style="display: none"></div>
  <DanmakuItem v-if="errMsg" type="info" :message="errMsg" />
  <Live v-else-if="ready" v-bind="props" />
</template>

<script>
import { defineComponent, reactive, onBeforeUnmount, ref, onMounted } from 'vue';
import { parseProps } from '@/utils/props';
import { setCors, autoGet } from '@/utils/request';
import { setFaceOption } from '@/utils/face';

import Live from '@/components/Live';
import DanmakuItem from '@/components/DanmakuItem';

export default defineComponent({
  components: { Live, DanmakuItem },
  setup() {
    const onHashChange = () => window.location.reload();
    window.addEventListener('hashchange', onHashChange);
    onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange));

    const props = reactive(parseProps(window.location.hash));

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
    setFaceOption({
      method: props.face,
      expireDay: props.faceExpireDay,
    });

    const ready = ref(false);
    const errMsg = ref('');

    if (props.anchor) {
      ready.value = true;
    } else {
      // 获取房间信息
      autoGet(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${props.room}`)
        .then(({ code, msg, data: { room_id, uid } }) => {
          if (code === 0) {
            props.room = parseInt(room_id);
            props.anchor = parseInt(uid);
            ready.value = true;
          } else {
            errMsg.value = msg;
          }
        })
        .catch(() => {
          errMsg.value = '获取房间信息失败';
          if (canCORS) errMsg.value += '，请检查是否正确禁用了浏览器的 web security 以允许直接跨域';
        });
    }

    if (props.debug) {
      import(/* webpackIgnore: true */ 'https://fastly.jsdelivr.net/npm/vconsole/dist/vconsole.min.js').then(() => {
        new window.VConsole();
      });
    }

    return { props, ready, errMsg };
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
