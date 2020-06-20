<template>
  <danmaku-item v-if="errMsg" type="warning" :message="errMsg" />
  <live v-else-if="ready" v-bind="props" />
</template>

<script>
import { reactive, onBeforeUnmount, ref } from 'vue';
import { parseProps } from '@/utils/props';
import { setCors, autoGet } from '@/utils/request';
import { setFaceOption } from '@/utils/face';

import Live from '@/components/Live';
import DanmakuItem from '@/components/DanmakuItem';

export default {
  components: { Live, DanmakuItem },
  setup() {
    const onHashChange = () => window.location.reload();
    window.addEventListener('hashchange', onHashChange);
    onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange));

    const props = reactive(parseProps(window.location.hash));
    const canCORS = props.cors === 'true';
    setCors(canCORS);
    setFaceOption({
      method: props.face,
      expireDay: props.faceExpireDay,
    });

    const ready = ref(false);
    const errMsg = ref('');

    // 获取房间信息
    autoGet(`https://api.live.bilibili.com/room_ex/v1/RoomNews/get?roomid=${props.room}`)
      .then(({ code, msg, data: { roomid, uid } }) => {
        if (code === 0) {
          props.room = parseInt(roomid);
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

    return { props, ready, errMsg };
  },
};
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
