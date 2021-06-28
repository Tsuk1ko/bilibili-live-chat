<template>
  <div id="panel" class="panel panel-default">
    <div class="panel-heading">
      <h2 class="panel-title" style="font-size: 30px; display: inline-block; margin-right: 10px">Bilibili Live Chat</h2>
      <iframe
        src="https://ghbtns.com/github-btn.html?user=Tsuk1ko&amp;repo=bilibili-live-chat&amp;type=star&amp;count=true&amp;size=large"
        frameborder="0"
        scrolling="0"
        width="160px"
        height="30px"
        style="vertical-align: bottom"
      ></iframe>
    </div>
    <div class="panel-body">
      <!-- 直播间号 -->
      <input-group header="直播间号">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="必填，支持短号"
          v-model.number="form.room"
        />
        <span class="input-group-btn">
          <button class="btn btn-primary" type="button" :disabled="!form.room" @click="goLive">Go!</button>
        </span>
      </input-group>
      <!-- 直接跨域 -->
      <input-group header="直接跨域">
        <select class="form-control" v-model="form.cors">
          <option v-for="{ value, text } in options.cors" :key="value" :value="value">{{ text }}</option>
        </select>
        <template #footer>
          <a href="https://github.com/Tsuk1ko/bilibili-live-chat#直接跨域" target="_blank">查看说明</a>
        </template>
      </input-group>
      <!-- 显示头像 -->
      <input-group header="显示头像">
        <select class="form-control" v-model="form.face">
          <option v-for="{ value, text } in options.face" :key="value" :value="value">{{ text }}</option>
        </select>
        <template #footer>
          <a href="https://github.com/Tsuk1ko/bilibili-live-chat#显示头像" target="_blank">查看说明</a>
        </template>
      </input-group>
      <!-- 头像缓存 -->
      <input-group header="头像缓存" footer="天">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，头像 URL 缓存的时间，默认为 7 天"
          v-model.number="form.faceExpireDay"
        />
      </input-group>
      <!-- 弹幕排列 -->
      <input-group header="弹幕排列">
        <select class="form-control" v-model="form.display">
          <option v-for="{ value, text } in options.display" :key="value" :value="value">{{ text }}</option>
        </select>
      </input-group>
      <!-- 弹幕停留 -->
      <input-group header="弹幕停留" footer="毫秒">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，弹幕过这么久后会被隐藏，仅弹幕排列为“自底部”时有效"
          v-model.number="form.stay"
        />
      </input-group>
      <!-- 频率限制 -->
      <input-group header="频率限制" footer="条/秒">
        <input
          type="number"
          min="1"
          step="1"
          class="form-control"
          placeholder="选填，限制弹幕频率（不包括礼物），若超出频率则会随机丢弃弹幕"
          v-model.number="form.limit"
        />
      </input-group>
      <!-- 礼物合并 -->
      <input-group header="礼物合并" footer="毫秒">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，合并统计的等待时间，不知道填多少可填 5000"
          v-model.number="form.giftComb"
        />
      </input-group>
      <!-- 礼物置顶 -->
      <input-group header="礼物置顶" footer="条">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，可将礼物置顶，与弹幕分开展示，此项相当于设置礼物区域的高度"
          v-model.number="form.giftPin"
        />
      </input-group>
      <!-- 弹幕延迟 -->
      <input-group header="弹幕延迟" footer="秒">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，收到弹幕后延迟这么久才会显示"
          v-model.number="form.delay"
        />
      </input-group>
    </div>
  </div>
</template>

<script>
import { unref, reactive, watchEffect, computed, readonly } from 'vue';
import InputGroup from '@/components/InputGroup';
import { sget, sset } from '@/utils/storage';
import { defaultProps, intProps, selectOptions } from '@/utils/props';
import { stringify as qss } from 'querystring';
import { fromPairs, pick } from 'lodash';

export default {
  components: { InputGroup },
  setup() {
    const form = reactive({
      ...defaultProps,
      ...sget('setting', {}),
    });
    intProps.forEach(key => {
      watchEffect(() => {
        if (typeof form[key] === 'number') form[key] = Math.max(Math.floor(form[key]), 0);
      });
    });

    const simpleForm = computed(() =>
      pick(
        fromPairs(
          Object.entries(form)
            .filter(([k, v]) => {
              const val = unref(v);
              return val && val !== defaultProps[k];
            })
            .map(([k, v]) => [k, unref(v)])
        ),
        Object.keys(defaultProps)
      )
    );
    watchEffect(() => {
      sset('setting', simpleForm.value);
    });

    return {
      form,
      goLive: () => (window.location.href = `live.html#${qss(simpleForm.value)}`),
      options: readonly(selectOptions),
    };
  },
};
</script>

<style>
body,
html {
  width: 100%;
  height: 100%;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
}
#app {
  margin: 16px;
}
@media screen and (min-width: 800px) {
  #app {
    width: 70%;
    min-width: 768px;
    max-width: 1024px;
  }
}
@media screen and (max-width: 799px) {
  #app {
    width: 100%;
  }
}
#panel {
  margin: 0;
}
.form-control {
  box-shadow: none !important;
}
input[type='checkbox'] {
  vertical-align: middle;
}
label {
  margin-bottom: 0;
  font-weight: 400;
}
.input-group:not(:last-child) {
  margin-bottom: 10px;
}
a {
  text-decoration: none !important;
}

.bl-0 {
  border-left: 0;
}
</style>
