<template>
  <div id="live">
    <danmaku-list
      ref="giftPinList"
      v-bind="props"
      :gift-show-face="showFace"
      :is-gift-list="true"
      v-if="props.giftPin"
    />
    <danmaku-list ref="danmakuList" v-bind="props" />
  </div>
</template>

<script>
import { onBeforeUnmount, ref, onMounted, computed } from 'vue';
import { KeepLiveWS } from 'bilibili-live-ws';
import { propsType } from '@/utils/props';
import { decodeDmV2 } from '@/utils/protobuf';

import DanmakuList from '@/components/DanmakuList';

export default {
  components: { DanmakuList },
  props: propsType,
  setup(props) {
    const giftPinList = ref(null);
    const danmakuList = ref(null);

    const giftCombMap = new Map();
    const showFace = computed(() => props.face !== 'false');

    const blockUIDs = computed(() => new Set(props.blockUID.split(/,|\|/).map(uid => uid.trim())));
    const isBlockedUID = uid => blockUIDs.value.has(String(uid));

    const addInfoDanmaku = message => {
      danmakuList.value.addDanmaku({
        type: 'info',
        message,
        stay: props.stay || 5000,
      });
    };
    const addDanmaku = danmaku => {
      if (props.limit) danmakuList.value.addSpeedLimitDanmaku(danmaku);
      else danmakuList.value.addDanmaku(danmaku);
    };

    onMounted(() => {
      console.log('正在连接直播弹幕服务器', { room: props.room, uid: props.anchor });
      const live = new KeepLiveWS(props.room, { protover: 3, uid: 0 });
      live.interval = 1000;
      onBeforeUnmount(() => live.close());
      live.on('open', () => {
        console.log('已连接直播弹幕服务器');
        addInfoDanmaku('已连接直播弹幕服务器');
      });
      live.on('live', () => {
        console.log('已连接直播间', props.room);
        addInfoDanmaku(`已连接直播间 ${props.room}`);
      });
      live.on('close', () => console.log('已断开与直播弹幕服务器的连接'));

      // 礼物
      const giftList = props.giftPin ? giftPinList : danmakuList;
      live.on('SEND_GIFT', ({ data: { uid, uname, action, giftName, num, face } }) => {
        if (isBlockedUID(uid)) {
          console.log(`屏蔽了来自[${uname}]的礼物：${giftName}*${num}`);
          return;
        }
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
              showFace: showFace.value,
              uid,
              uname,
              action,
              giftName,
              num,
              face,
            });
            setTimeout(() => {
              giftList.value.addDanmaku(giftCombMap.get(key));
              giftCombMap.delete(key);
            }, props.giftComb);
          }
        } else {
          giftList.value.addDanmaku({
            type: 'gift',
            showFace: showFace.value,
            uid,
            uname,
            action,
            giftName,
            num,
            face,
          });
        }
      });

      // 弹幕
      live.on('DANMU_MSG', ({ info: [, message, [uid, uname, isOwner /*, isVip, isSvip*/]], dm_v2 }) => {
        if (isBlockedUID(uid)) {
          console.log(`屏蔽了来自[${uname}]的弹幕：${message}`);
          return;
        }
        const danmaku = {
          type: 'message',
          showFace: showFace.value,
          uid,
          uname,
          message,
          isAnchor: uid === props.anchor,
          isOwner: !!isOwner,
        };
        if (dm_v2) {
          try {
            const {
              user: { face },
            } = decodeDmV2(dm_v2);
            danmaku.face = face;
          } catch (error) {
            console.error('[decode dm_v2 error]', error);
          }
        }
        if (props.delay > 0) setTimeout(() => addDanmaku(danmaku), props.delay * 1000);
        else addDanmaku(danmaku);
      });

      // SC
      live.on(
        'SUPER_CHAT_MESSAGE',
        ({
          data: {
            uid,
            user_info: { uname, face },
            message,
          },
        }) => {
          giftList.value.addDanmaku({
            type: 'sc',
            showFace: showFace.value,
            uid,
            uname,
            message,
            face,
          });
        }
      );

      // 舰长
      live.on('USER_TOAST_MSG', ({ data: { uid, username: uname, role_name: giftName, num } }) => {
        giftList.value.addDanmaku({
          type: 'gift',
          showFace: showFace.value,
          uid,
          uname,
          giftName,
          num,
        });
      });
    });

    return { props, showFace, giftPinList, danmakuList };
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
