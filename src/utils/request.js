import { stringify as qss } from 'query-string';

let canCORS = true;
export const setCors = bool => (canCORS = bool);

export const get = url => fetch(url).then(r => r.json());
export const corsGet = url =>
  fetch(`https://json2jsonp.com/?${qss({ url, callback: '_' })}`)
    .then(r => r.text())
    .then(jsonp => JSON.parse(jsonp.replace(/^_\((.*)\)$/, '$1')));
export const autoGet = url => (canCORS ? get(url) : corsGet(url));
