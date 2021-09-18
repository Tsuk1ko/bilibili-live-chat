import { sget, sset } from './storage';
import { get, autoGet } from './request';
import { debounce, fromPairs, last } from 'lodash';

const getDay = () => Math.floor(Date.now() / 86400000);

const options = {
  method: 'false',
  expireDay: 7,
};
export const setFaceOption = o => Object.assign(options, o);

const faceApi = uid => {
  switch (options.method) {
    case 'imjad':
      return get(`https://api.imjad.cn/bilibili/v2/?get=space&vmid=${uid}&pagesize=1`).then(r => r.data?.card?.face);
    default:
      return autoGet(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(r => r.data?.face);
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

const faceMap = new Map(Object.entries(sget('face', {}))
                              .filter(([, face]) => !isFaceExpired(face))
                              .map(([uid, face]) => [Number(uid), face]));

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
  return getFaceLoads(setFace(uid, await faceApi(uid)));
};
