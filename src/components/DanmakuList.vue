<template>
  <div v-if="isGiftList" class="danmaku-list-pinned" ref="danmakuListRef">
    <div class="danmaku-list hidden">
      <danmaku-item
        v-for="i in giftPin"
        :key="i"
        :show-face="giftShowFace"
        type="gift"
        uname="某人"
        giftName="礼物"
        :num="i"
      />
    </div>
    <div class="danmaku-list absolute" ref="giftListRef">
      <danmaku-item
        v-for="item in danmakuList"
        :key="item.key"
        v-bind="item.props"
        :hidden="item.hidden"
        :ref="el => (item.el = el)"
      />
    </div>
  </div>
  <div v-else class="danmaku-list" ref="danmakuListRef">
    <div v-if="display === 'bottom'" class="danmaku-list-placeholder"></div>
    <danmaku-item
      v-for="item in danmakuList"
      :key="item.key"
      v-bind="item.props"
      :hidden="item.hidden"
      :ref="el => (item.el = el)"
    />
  </div>
</template>

<script>
import { ref, toRefs, onBeforeUnmount, nextTick, onMounted, unref } from 'vue';
import { v4 as uuid } from 'uuid';
import { propsType } from '@/utils/props';
import { getFaceLoads } from '@/utils/face';
import loadImg from '@/utils/loadImg';
import { sampleSize } from 'lodash';

import DanmakuItem from '@/components/DanmakuItem';

const loadedMap = new Map();

export default {
  components: { DanmakuItem },
  props: {
    ...propsType,
    isGiftList: Boolean,
    giftShowFace: Boolean,
  },
  setup(props) {
    // 运行状态
    let RUNNING = true;
    onBeforeUnmount(() => (RUNNING = false));

    // 弹幕列表
    const danmakuList = ref([]);
    const danmakuListRef = ref(null);
    const giftListRef = ref(null);

    // 移除不可见弹幕
    onMounted(() => {
      const topOfList = danmakuListRef.value.getBoundingClientRect().top - 5;
      const removeInvisibleDanmaku = () => {
        const i = danmakuList.value.findIndex(item => {
          const { top = topOfList, height = 0 } = item.el?.$el?.getBoundingClientRect() ?? {};
          if (top < topOfList) item.hidden = true;
          return top + height > topOfList && !item.el?.needRemoved;
        });
        if (i > 0) danmakuList.value.splice(0, i);
      };
      const danmakuInterval = setInterval(removeInvisibleDanmaku, 100);
      onBeforeUnmount(() => clearInterval(danmakuInterval));
    });

    // 滚动到最底部（为了平滑滚动）
    const scrollList = () => {
      const el = unref(props.isGiftList ? giftListRef : danmakuListRef);
      if (el) el.scrollTop = el.scrollHeight;
    };
    if (!props.isGiftList) {
      onMounted(() => window.addEventListener('resize', scrollList));
      onBeforeUnmount(() => window.removeEventListener('resize', scrollList));
    }

    // 普通弹幕队列
    const danmakuQueue = [];
    const handleDanmakuQueue = () => {
      let sleep = 200;
      const { length } = danmakuQueue;
      if (length > 0) {
        sleep = Math.min(sleep, 1000 / length);
        danmakuList.value.push(danmakuQueue.shift());
        nextTick(scrollList);
      }
      if (RUNNING) setTimeout(handleDanmakuQueue, sleep);
    };
    handleDanmakuQueue();

    // 添加弹幕
    const addDanmaku = async danmaku => {
      if (danmaku.showFace && danmaku.face) {
        const loads = getFaceLoads(danmaku.face);
        let load;
        let [face] = loads.find(([src]) => (load = loadedMap.get(src))) || [];
        if (!face) {
          load = loadImg(loads);
          loadedMap.set(face, load);
          face = await load;
          loadedMap.set(face, true);
        } else if (load !== true) {
          face = await load;
        }
        danmaku.face = face;
      }
      danmaku.stay = danmaku.stay || (props.display === 'bottom' ? props.stay : 0);
      danmakuQueue.push({
        props: danmaku,
        key: uuid(),
        el: null,
        hidden: false,
      });
    };

    // 限速弹幕队列
    const speedLimitQueue = [];
    if (props.limit) {
      const handleSpeedLimitInterval = setInterval(() => {
        let temp = speedLimitQueue.splice(0);
        if (!temp.length) return;
        if (temp.length > props.limit) {
          temp = sampleSize(Object.keys(temp), props.limit)
            .sort()
            .map(i => temp[i]);
        }
        temp.forEach(danmaku => addDanmaku(danmaku));
      }, 1000);
      onBeforeUnmount(() => clearInterval(handleSpeedLimitInterval));
    }

    // 添加限速弹幕
    const addSpeedLimitDanmaku = danmaku => speedLimitQueue.push(danmaku);

    return {
      ...toRefs(props),
      danmakuList,
      danmakuListRef,
      giftListRef,
      addDanmaku,
      addSpeedLimitDanmaku,
    };
  },
};
</script>

<style lang="scss">
.danmaku-list {
  flex-grow: 1;
  width: 100%;
  overflow: hidden;
  scroll-behavior: smooth;
  &.hidden {
    visibility: hidden;
  }
  &.absolute {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
  &-pinned {
    position: relative;
    flex-grow: 0;
    flex-shrink: 0;
    width: 100%;
  }
  &-placeholder {
    height: 100%;
  }
}
</style>
