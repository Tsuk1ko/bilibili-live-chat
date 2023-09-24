import { pick } from 'lodash';

let canCORS = true;

export const setCors = bool => (canCORS = bool);

export const getResp = (url, options = {}) => fetch(url, { referrer: '', referrerPolicy: 'no-referrer', ...options });

export const get = (url, options) => getResp(url, options).then(r => r.json());

export const corsGetResp = (url, options) =>
  fetch('https://blc-proxy.lolicon.app', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, ...pick(options, ['method', 'headers', 'body']) }),
    referrerPolicy: 'origin',
  });

export const corsGet = (url, options) => corsGetResp(url, options).then(r => r.json());

export const autoGet = (url, options) => (canCORS ? get(url, options) : corsGet(url, options));

export const autoGetResp = (url, options) => (canCORS ? getResp(url, options) : corsGetResp(url, options));
