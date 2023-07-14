import { sget, sset } from './storage';
import { getResp, autoGetResp } from './request';
import { debounce, fromPairs, last } from 'lodash';

const getDay = () => Math.floor(Date.now() / 86400000);

const options = {
  method: 'false',
  expireDay: 7,
};
export const setFaceOption = o => Object.assign(options, o);

const faceApi = async uid => {
  switch (options.method) {
    case 'imjad': {
      const res = await getResp(`https://api.obfs.dev/api/bilibili/v3/user_info?uid=${uid}&size=1`);
      if (res.status === 429) {
        throw new Error('弹幕量过大，API调用超频，请关闭显示头像（可仅对礼物显示）');
      }
      const r = await res.json();
      return r.data?.card?.face;
    }
    default: {
      const res = await autoGetResp(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`);
      if (res.status === 412) {
        throw new Error('弹幕量过大，API调用超频，请关闭显示头像（可仅对礼物显示）');
      }
      const r = await res.json();
      return r.data?.card?.face;
    }
  }
};

const getFaceLoads = ([i, file]) => {
  if (!file) file = 'member/noface.jpg';
  const ext = last(file.split('.'));
  const url = `https://i${i}.hdslb.com/bfs/face/${file}`;
  if (ext === 'gif') return [[url, 0]];
  else {
    return [
      [`${url}_48x48.${ext}`, 2000],
      [url, 5000],
    ];
  }
};
const isFaceExpired = ([, , t]) => !t || getDay() - t >= options.expireDay;

const faceMap = new Map(
  Object.entries(sget('face', {}))
    .filter(([, face]) => !isFaceExpired(face))
    .map(([uid, face]) => [Number(uid), face])
);

const saveFaceMap = debounce(() => sset('face', fromPairs(Array.from(faceMap))), 5000, { maxWait: 5000 });

export const setFace = (uid, url) => {
  if (!url) return;
  const server = parseInt(/\/\/i(\d+)\./.exec(url)?.[1]) || 0;
  const img = last(url.split('/'));
  const face = img.includes('noface') ? [0, null, getDay()] : [server, img, getDay()];
  faceMap.set(uid, face);
  saveFaceMap();
  return face;
};

export const getFace = async uid => {
  const face = faceMap.get(uid);
  if (face && !isFaceExpired(face)) {
    return getFaceLoads(face);
  }
  try {
    return getFaceLoads(setFace(uid, await faceApi(uid)));
  } catch (e) {
    console.error('[face API error]', e);
  }
  return getFaceLoads([0, null]);
};
