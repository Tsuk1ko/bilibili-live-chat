import { LRUCache } from 'lru-cache';
import loadImg from './loadImg';
import { last } from 'lodash';

// const NO_FACE = 'https://i0.hdslb.com/bfs/face/member/noface.jpg';

// 不用缓存了
window.localStorage.removeItem('blc-face');

/** @type {LRUCache<string, string | Promise<string>>} */
const cache = new LRUCache({ max: 500, ttl: 600 * 1000, updateAgeOnGet: true });

const getFaceLoads = face => {
  const smallFace = getSmallFace(face);
  if (smallFace) {
    return [
      [smallFace, 2000],
      [face, 5000],
    ];
  }
  return [[face, 0]];
};

const getSmallFace = url => {
  if (url.endsWith('.gif') || url.includes('noface')) return;
  return url.replace(/(\.[^./]+$)/, '$1_48x48$1');
};

export const loadFace = async (uid, url) => {
  const key = uid || last(url.split('/'));
  if (cache.has(key)) return cache.get(key);

  const loads = getFaceLoads(url.replace(/^http:/, 'https:'));
  const loadPromise = loadImg(loads);
  cache.set(key, loadPromise);
  const finalUrl = await loadPromise;
  cache.set(key, finalUrl);

  return finalUrl;
};
