<template>
  <div id="live">
    <danmaku-list
      ref="giftPinList"
      v-bind="props"
      :gift-show-face="giftShowFace"
      :is-gift-list="true"
      v-if="props.giftPin"
    />
    <danmaku-list ref="danmakuList" v-bind="props" />
  </div>
</template>

<script>
import { onBeforeUnmount, ref, onMounted, computed } from 'vue';
import { propsType } from '@/utils/props';
import { setFace } from '@/utils/face';
import { KeepLiveWS } from 'bilibili-live-ws';

import DanmakuList from '@/components/DanmakuList';

export default {
  components: { DanmakuList },
  props: propsType,
  setup(props) {
    console.log('正在连接直播弹幕服务器');
    const live = new KeepLiveWS(props.room);
    onBeforeUnmount(() => live.close());
    live.on('open', () => console.log('已连接直播弹幕服务器'));
    live.on('live', () => console.log('已进入直播间', props.room));
    live.on('close', () => console.log('已断开与直播弹幕服务器的连接'));
    live.on('heartbeat', online => console.log('当前人气值', online));
    window.closeLive = () => live.close();

    const giftPinList = ref(null);
    const danmakuList = ref(null);

    const giftCombMap = new Map();

    const giftShowFace = computed(() => !['false', 'gift'].includes(props.face));

    onMounted(() => {
      // 礼物
      const giftList = props.giftPin ? giftPinList : danmakuList;
      live.on('SEND_GIFT', ({ data: { uid, uname, action, giftName, num, face } }) => {
        setFace(uid, face);
        if (props.giftComb) {
          const key = `${uid}-${giftName}`;
          const existComb = giftCombMap.get(key);
          if (existComb) {
            giftCombMap.set(key, {
              ...existComb,
              num: existComb.num + num,
            });
          } else {
            giftCombMap.set(key, {
              type: 'gift',
              showFace: props.face !== 'false',
              uid,
              uname,
              action,
              giftName,
              num,
            });
            setTimeout(() => {
              giftList.value.addDanmaku(giftCombMap.get(key));
              giftCombMap.delete(key);
            }, props.giftComb);
          }
        } else {
          giftList.value.addDanmaku({
            type: 'gift',
            showFace: props.face !== 'false',
            uid,
            uname,
            action,
            giftName,
            num,
          });
        }
      });
      // 弹幕
      live.on('DANMU_MSG', ({ info: [, message, [uid, uname, isOwner /*, isVip, isSvip*/]] }) => {
        const danmaku = {
          type: 'message',
          showFace: giftShowFace.value,
          uid,
          uname,
          message,
          isAnchor: uid === props.anchor,
          isOwner: !!isOwner,
        };
        if (props.limit) danmakuList.value.addSpeedLimitDanmaku(danmaku);
        else danmakuList.value.addDanmaku(danmaku);
      });
    });

    return { props, giftShowFace, giftPinList, danmakuList };
  },
};
</script>

<style lang="scss">
#live {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: transparent;
  display: flex;
  flex-direction: column;
}
</style>
