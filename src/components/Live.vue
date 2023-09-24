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
  props: {
    ...propsType,
    anchor: Number,
    liveWsOptions: Object,
  },
  setup(props) {
    const giftPinList = ref(null);
    const danmakuList = ref(null);

    const giftCombMap = new Map();
    const showFace = computed(() => props.face !== 'false');

    const blockUIDs = computed(() => new Set(props.blockUID.split(/,|\|/).map(uid => uid.trim())));
    const isBlockedUID = uid => blockUIDs.value.has(String(uid));

    let failedTimestamps = [];

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
      console.log('正在连接直播弹幕服务器', props.room);
      const live = new KeepLiveWS(props.room, props.liveWsOptions || { protover: 3, uid: 0 });
      live.interval = 1000;
      onBeforeUnmount(() => live.close());
      live.on('open', () => {
        if (live.closed) return;
        console.log('已连接直播弹幕服务器');
        addInfoDanmaku('已连接直播弹幕服务器');
      });
      live.on('live', () => {
        if (live.closed) return;
        console.log('已连接直播间', props.room);
        addInfoDanmaku(`已连接直播间 ${props.room}`);
      });
      live.on('close', () => {
        if (live.closed) return;
        console.log('连接已断开');
        addInfoDanmaku('连接已断开');
        const now = Date.now();
        failedTimestamps = failedTimestamps.filter(time => now - time < 10000);
        failedTimestamps.push(now);
        if (failedTimestamps.length >= 3) {
          console.log('连接失败过于频繁，停止重连');
          addInfoDanmaku('连接失败过于频繁，停止重连');
          live.close();
        }
      });

      // 礼物
      const giftList = props.giftPin ? giftPinList : danmakuList;
      live.on('SEND_GIFT', ({ data }) => {
        handleSendGift(data);
      });
      live.on('LIVE_OPEN_PLATFORM_SEND_GIFT', ({ data: { uid, uname, gift_name, gift_num, uface } }) => {
        handleSendGift({ uid, uname, giftName: gift_name, num: gift_num, face: uface });
      });
      const handleSendGift = ({ uid, uname, giftName, num, face }) => {
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
            giftName,
            num,
            face,
          });
        }
      };

      // 弹幕
      live.on('DANMU_MSG', ({ info: [, message, [uid, uname, isOwner]], dm_v2 }) => {
        handleDanmaku({ uid, uname, message, isOwner, dmV2: dm_v2 });
      });
      live.on('LIVE_OPEN_PLATFORM_DM', ({ data: { uid, uname, msg, uface } }) => {
        handleDanmaku({ uid, uname, message: msg, face: uface });
      });
      const handleDanmaku = ({ uid, uname, message, isOwner, dmV2, face }) => {
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
          face,
        };
        if (dmV2) {
          try {
            const {
              user: { face },
            } = decodeDmV2(dmV2);
            danmaku.face = face;
          } catch (error) {
            console.error('[decode dmV2 error]', error);
          }
        }
        if (props.delay > 0) setTimeout(() => addDanmaku(danmaku), props.delay * 1000);
        else addDanmaku(danmaku);
      };

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
          handleSuperChat({ uid, uname, message, face });
        }
      );
      live.on('LIVE_OPEN_PLATFORM_SUPER_CHAT', ({ data: { uid, uname, message, uface } }) => {
        handleSuperChat({ uid, uname, message, face: uface });
      });
      const handleSuperChat = ({ uid, uname, message, face }) => {
        giftList.value.addDanmaku({
          type: 'sc',
          showFace: showFace.value,
          uid,
          uname,
          message,
          face,
        });
      };

      // 舰长
      const guardLevelMap = { 1: '总督', 2: '提督', 3: '舰长' };
      live.on('GUARD_BUY', ({ data: { uid, username, gift_name, num } }) => {
        handleGuard({ uid, uname: username, giftName: gift_name, num });
      });
      live.on('USER_TOAST_MSG', ({ data: { uid, username, role_name, num, unit } }) => {
        handleGuard({ uid, uname: username, giftName: role_name, num, unit });
      });
      live.on(
        'LIVE_OPEN_PLATFORM_GUARD',
        ({
          data: {
            user_info: { uid, uname, uface },
            guard_level,
            guard_num,
            guard_unit,
          },
        }) => {
          handleGuard({
            uid,
            uname,
            giftName: guardLevelMap[guard_level],
            num: guard_num,
            unit: guard_unit,
            face: uface,
          });
        }
      );
      const handleGuard = ({ uid, uname, giftName, num, unit, face }) => {
        giftList.value.addDanmaku({
          type: 'gift',
          showFace: showFace.value,
          uid,
          uname,
          giftName: unit ? `${num}个${unit}${giftName}` : giftName,
          num: unit ? 0 : num,
          face,
        });
      };
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
