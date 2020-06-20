import { parse as qsp } from 'query-string';
import { mapValues, pick } from 'lodash';

export const defaultProps = {
  room: '',
  anchor: '',
  cors: 'false',
  face: 'false',
  faceExpireDay: '',
  display: 'bottom',
  stay: '',
  limit: '',
  giftComb: '',
  giftPin: '',
};
Object.freeze(defaultProps);

export const intProps = ['room', 'anchor', 'faceExpireDay', 'stay', 'giftComb', 'limit', 'giftPin'];
Object.freeze(intProps);

export const intPropsSet = new Set(intProps);
Object.freeze(intPropsSet);

export const isIntProp = name => intPropsSet.has(name);

const intPropsDefault = {
  faceExpireDay: 7,
};
Object.freeze(intPropsDefault);

export const propsType = mapValues(defaultProps, (v, k) => (intPropsSet.has(k) ? Number : String));
Object.freeze(propsType);

export const selectOptions = {
  cors: [
    {
      value: 'false',
      text: '关闭（所有跨域请求将依赖 json2jsonp）',
    },
    {
      value: 'true',
      text: '开启（请阅读右侧说明）',
    },
  ],
  face: [
    {
      value: 'false',
      text: '不显示',
    },
    {
      value: 'gift',
      text: '仅对礼物显示，不需要额外调用 API',
    },
    {
      value: 'true',
      text: '显示，通过 Bilibili API 获取（建议启用直接跨域再使用）',
    },
    {
      value: 'imjad',
      text: '显示，通过 Imjad API 获取',
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
