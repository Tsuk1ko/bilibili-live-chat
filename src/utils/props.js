import { parse as qsp } from 'query-string';
import { mapValues, pick } from 'lodash';

export const defaultProps = {
  auth: 'guest',
  akId: '',
  akSecred: '',
  appId: '',
  code: '',
  room: '',
  anchor: '',
  cors: 'false',
  face: 'true',
  display: 'bottom',
  stay: '',
  limit: '',
  giftComb: '',
  giftPin: '',
  delay: '',
  blockUID: '',
  debug: '',
  customCss: '',
};
Object.freeze(defaultProps);

export const intProps = ['room', 'anchor', 'stay', 'giftComb', 'limit', 'giftPin', 'delay', 'appId'];
Object.freeze(intProps);

export const intPropsSet = new Set(intProps);
Object.freeze(intPropsSet);

export const isIntProp = name => intPropsSet.has(name);

const intPropsDefault = {};
Object.freeze(intPropsDefault);

export const propsType = mapValues(defaultProps, (v, k) => (intPropsSet.has(k) ? Number : String));
Object.freeze(propsType);

export const selectOptions = {
  auth: [
    {
      value: 'guest',
      text: '游客模式',
    },
    {
      value: 'open',
      text: '开放平台',
    },
  ],
  cors: [
    {
      value: 'false',
      text: '关闭（所有跨域请求将依赖 codetabs）',
    },
    {
      value: 'true',
      text: '开启（请阅读右侧说明）',
    },
  ],
  face: [
    {
      value: 'true',
      text: '显示',
    },
    {
      value: 'false',
      text: '不显示',
    },
  ],
  display: [
    {
      value: 'bottom',
      text: '自底部',
    },
    {
      value: 'top',
      text: '从顶部',
    },
  ],
};
Object.freeze(selectOptions);

export const parseProps = qs =>
  mapValues(
    pick(
      {
        ...defaultProps,
        ...qsp(qs),
      },
      Object.keys(defaultProps)
    ),
    (v, k) => {
      if (isIntProp(k)) return (v && parseInt(v)) || intPropsDefault[k] || 0;
      if (k in selectOptions) return selectOptions[k].some(({ value }) => value === v) ? v : defaultProps[k];
      return v || defaultProps[k];
    }
  );
