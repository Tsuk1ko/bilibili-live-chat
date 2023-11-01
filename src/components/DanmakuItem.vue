<template>
  <div class="danmaku-item" :class="{ hidden: isHidden }">
    <img v-if="showFace && face" class="danmaku-author-face" :src="face" />
    <div v-if="type === 'message'" class="danmaku-content">
      <span class="danmaku-author-name with-colon" :class="{ anchor: isAnchor, owner: isOwner }">{{ uname }}</span>
      <span class="danmaku-message">{{ message }}</span>
    </div>
    <div v-else-if="type === 'gift'" class="danmaku-content">
      <span class="danmaku-message">感谢&nbsp;</span>
      <span class="danmaku-author-name">{{ uname }}</span>
      <span class="danmaku-message">&nbsp;赠送的&nbsp;</span>
      <span class="danmaku-gift-name">{{ giftName }}</span>
      <template v-if="num">
        <span class="danmaku-message">&nbsp;×&nbsp;</span>
        <span class="danmaku-gift-num">{{ num }}</span>
      </template>
    </div>
    <div v-else-if="type === 'sc'" class="danmaku-content">
      <span class="danmaku-message">感谢&nbsp;</span>
      <span class="danmaku-author-name">{{ uname }}</span>
      <span class="danmaku-message">&nbsp;的SC：{{ message }}</span>
    </div>
    <div v-else-if="type === 'info'" class="danmaku-content">
      <span class="danmaku-message info">{{ message }}</span>
    </div>
  </div>
</template>

<script>
import { toRefs, ref, computed, onBeforeUnmount } from 'vue';

export default {
  props: {
    type: {
      type: String,
      default: 'message',
    },
    showFace: Boolean,
    face: String,
    uid: Number,
    uname: String,
    message: String,
    isAnchor: Boolean,
    isOwner: Boolean,
    giftName: String,
    num: Number,
    stay: Number,
    hidden: Boolean,
  },
  setup(props) {
    const hidden = ref(false);
    const needRemoved = ref(false);
    if (props.stay) {
      const stayTimeout = setTimeout(() => {
        hidden.value = true;
        if (props.type === 'info') {
          setTimeout(() => (needRemoved.value = true), 800);
        }
      }, props.stay);
      onBeforeUnmount(() => clearTimeout(stayTimeout));
    }
    const isHidden = computed(() => props.hidden || hidden.value);
    return { ...toRefs(props), isHidden, needRemoved };
  },
};
</script>

<style lang="scss">
@keyframes danmakuIn {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.danmaku {
  &-item {
    padding: 4px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    transition: opacity 0.5s;
    user-select: none;
    text-shadow:
      -2px -2px #000000,
      -2px -1px #000000,
      -2px 0 #000000,
      -2px 1px #000000,
      -2px 2px #000000,
      -1px -2px #000000,
      -1px -1px #000000,
      -1px 0 #000000,
      -1px 1px #000000,
      -1px 2px #000000,
      0 -2px #000000,
      0 -1px #000000,
      0 0 #000000,
      0 1px #000000,
      0 2px #000000,
      1px -2px #000000,
      1px -1px #000000,
      1px 0 #000000,
      1px 1px #000000,
      1px 2px #000000,
      2px -2px #000000,
      2px -1px #000000,
      2px 0 #000000,
      2px 1px #000000,
      2px 2px #000000;
    animation: 0.5s danmakuIn;
    opacity: 1;
    &.hidden {
      opacity: 0;
    }
  }
  &-author-face {
    width: 24px;
    height: 24px;
    border-radius: 24px;
    margin-right: 6px;
    display: inline-block;
    pointer-events: none;
  }
  &-content {
    overflow: initial;
    align-self: center;
  }
  &-author-name {
    color: #8cd9ff;
    &.with-colon::after {
      content: '：';
      margin-left: 2px;
    }
    // 主播
    &.anchor {
      color: #fff248;
    }
    // 房管
    &.owner {
      color: #ff9800;
    }
  }
  &-message,
  &-gift-num {
    color: #fff;
  }
  &-gift-name {
    color: #eb76ff;
  }
  &-message {
    font-family: 'Imprima', 'Microsoft YaHei';
    font-size: 18px;
    line-height: 18px;
    &.info {
      white-space: pre-wrap;
    }
  }
  &-gift-num {
    font-family: 'Imprima', 'Microsoft YaHei';
    font-size: 20px;
    line-height: 20px;
    font-weight: 500;
  }
  &-author-name,
  &-gift-name {
    font-family: 'Changa One', 'Microsoft YaHei';
    font-size: 20px;
    line-height: 20px;
    font-weight: 500;
  }
}
</style>
