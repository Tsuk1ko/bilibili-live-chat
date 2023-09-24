<template>
  <div id="panel" class="panel panel-default" spellcheck="false">
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
      <button class="btn btn-primary" type="button" :disabled="!form.room" @click="goLive">Go!</button>
      <button class="btn" :class="copyLinkClass" type="button" :disabled="!form.room" @click="copyLink">
        {{ copyLinkText }}
      </button>
    </div>
    <div class="panel-body">
      <!-- 连接模式 -->
      <InputGroup header="连接模式">
        <select class="form-control" v-model="form.auth">
          <option v-for="{ value, text } in options.auth" :key="value" :value="value">{{ text }}</option>
        </select>
        <template #footer>
          <a href="https://github.com/Tsuk1ko/bilibili-live-chat#连接模式" target="_blank">查看说明</a>
        </template>
      </InputGroup>
      <template v-if="form.auth === 'normal'">
        <!-- 直播间号 -->
        <InputGroup header="直播间号">
          <input
            class="form-control"
            type="number"
            min="0"
            step="1"
            placeholder="必填，支持短号"
            v-model.number="form.room"
          />
        </InputGroup>
        <!-- Cookie -->
        <InputGroup header="Cookie">
          <input class="form-control" type="text" placeholder="选填，不填则为游客模式" v-model="form.cookie" />
        </InputGroup>
      </template>
      <template v-else-if="form.auth === 'open'">
        <!-- AKId -->
        <InputGroup header="AKId">
          <input
            class="form-control"
            type="text"
            placeholder="必填，开放平台 - 个人资料 - access_key_id"
            v-model="form.akId"
          />
        </InputGroup>
        <!-- AKSecret -->
        <InputGroup header="AKSecret">
          <input
            class="form-control"
            type="text"
            placeholder="必填，开放平台 - 个人资料 - access_key_secret"
            v-model="form.akSecret"
          />
        </InputGroup>
        <!-- AppId -->
        <InputGroup header="AppId">
          <input
            class="form-control"
            type="number"
            min="0"
            step="1"
            placeholder="必填，开放平台 - 我的项目 - 项目ID"
            v-model.number="form.appId"
          />
        </InputGroup>
        <!-- 身份码 -->
        <InputGroup header="身份码">
          <input class="form-control" type="text" placeholder="必填，直播间开播后可见" v-model="form.code" />
        </InputGroup>
      </template>
      <!-- 跨域模式 -->
      <InputGroup header="跨域模式">
        <select class="form-control" v-model="form.cors">
          <option v-for="{ value, text } in options.cors" :key="value" :value="value">{{ text }}</option>
        </select>
        <template #footer>
          <a href="https://github.com/Tsuk1ko/bilibili-live-chat#跨域模式" target="_blank">查看说明</a>
        </template>
      </InputGroup>
      <!-- 显示头像 -->
      <InputGroup header="显示头像">
        <select class="form-control" v-model="form.face">
          <option v-for="{ value, text } in options.face" :key="value" :value="value">{{ text }}</option>
        </select>
      </InputGroup>
      <!-- 弹幕排列 -->
      <InputGroup header="弹幕排列">
        <select class="form-control" v-model="form.display">
          <option v-for="{ value, text } in options.display" :key="value" :value="value">{{ text }}</option>
        </select>
      </InputGroup>
      <!-- 弹幕停留 -->
      <InputGroup header="弹幕停留" footer="毫秒">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，弹幕过这么久后会被隐藏，仅弹幕排列为“自底部”时有效"
          v-model.number="form.stay"
        />
      </InputGroup>
      <!-- 频率限制 -->
      <InputGroup header="频率限制" footer="条/秒">
        <input
          type="number"
          min="1"
          step="1"
          class="form-control"
          placeholder="选填，限制弹幕频率（不包括礼物），若超出频率则会随机丢弃弹幕"
          v-model.number="form.limit"
        />
      </InputGroup>
      <!-- 礼物合并 -->
      <InputGroup header="礼物合并" footer="毫秒">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，合并统计的等待时间，不知道填多少可填 5000"
          v-model.number="form.giftComb"
        />
      </InputGroup>
      <!-- 礼物置顶 -->
      <InputGroup header="礼物置顶" footer="条">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，可将礼物置顶，与弹幕分开展示，此项相当于设置礼物区域的高度"
          v-model.number="form.giftPin"
        />
      </InputGroup>
      <!-- 弹幕延迟 -->
      <InputGroup header="弹幕延迟" footer="秒">
        <input
          class="form-control"
          type="number"
          min="0"
          step="1"
          placeholder="选填，收到弹幕后延迟这么久才会显示"
          v-model.number="form.delay"
        />
      </InputGroup>
      <!-- 屏蔽用户 -->
      <InputGroup header="屏蔽用户">
        <input
          class="form-control"
          type="text"
          placeholder="选填，将不显示指定UID用户的弹幕和礼物，用英文逗号(,)分隔"
          v-model="form.blockUID"
        />
      </InputGroup>
      <InputGroup header="自定义CSS">
        <textarea
          class="form-control"
          placeholder="OBS在添加浏览器的时候可以设置自定义CSS，不需要该设置项"
          v-model="form.customCss"
        />
      </InputGroup>
    </div>
  </div>
</template>

<script>
import { defineComponent, unref, reactive, watch, computed, readonly, ref } from 'vue';
import InputGroup from '@/components/InputGroup.vue';
import { sget, sset } from '@/utils/storage';
import { defaultProps, intProps, selectOptions } from '@/utils/props';
import { stringify as qss } from 'query-string';
import { fromPairs, pick, omit } from 'lodash';

export default defineComponent({
  components: { InputGroup },
  setup() {
    const form = reactive({
      ...defaultProps,
      ...sget('setting', {}),
    });
    // 迁移
    if (form.face !== 'false') form.face = true;
    intProps.forEach(key => {
      watch(
        () => form[key],
        value => {
          if (typeof value !== 'number') return;
          const newVal = Math.max(Math.floor(value), 0);
          if (value === newVal) return;
          form[key] = newVal;
        },
        { immediate: true }
      );
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
    watch(simpleForm, value => {
      sset('setting', value);
    });

    const getFinalForm = () => {
      let data = simpleForm.value;
      switch (form.auth) {
        case 'normal':
          data = omit(data, ['akId', 'akSecret', 'appId', 'code']);
          break;
        case 'open':
          data = omit(data, ['room', 'cookie']);
          break;
      }
      return data;
    };

    const copyLinkStatus = ref('');
    const copyLinkClass = computed(() => (copyLinkStatus.value ? `btn-${copyLinkStatus.value}` : 'btn-primary'));
    const copyLinkText = computed(() => {
      switch (copyLinkStatus.value) {
        case 'success':
          return '复制成功';
        case 'error':
          return '复制失败';
        default:
          return '复制链接';
      }
    });

    const copyLink = async () => {
      if (copyLinkStatus.value) return;
      try {
        await navigator.clipboard.writeText(new URL(`live.html#${qss(getFinalForm())}`, location.origin).href);
        copyLinkStatus.value = 'success';
      } catch {
        copyLinkStatus.value = 'error';
      } finally {
        setTimeout(() => {
          copyLinkStatus.value = '';
        }, 2000);
      }
    };

    return {
      form,
      goLive: () => (window.location.href = `live.html#${qss(getFinalForm())}`),
      copyLink,
      copyLinkClass,
      copyLinkText,
      options: readonly(selectOptions),
    };
  },
});
</script>

<style lang="scss">
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
  .btn {
    float: right;
    margin-left: 8px;
  }
}
.btn {
  outline: none !important;
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
.input-group-addon.front {
  min-width: 81px;
}
a {
  text-decoration: none !important;
}

.bl-0 {
  border-left: 0;
}
</style>
