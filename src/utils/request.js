let canCORS = true;

export const setCors = bool => (canCORS = bool);

export const getResp = (url, options = {}) => fetch(url, { referrer: '', referrerPolicy: 'no-referrer', ...options });

export const get = (url, options) => getResp(url, options).then(r => r.json());

export const corsGetResp = (url, options) => getResp(`https://api.codetabs.com/v1/proxy/?quest=${url}`, options);

export const corsGet = (url, options) => get(`https://api.codetabs.com/v1/proxy/?quest=${url}`, options);

// 估计 json2jsonp 被B站拉黑了
// export const corsGet = url =>
//   fetch(`https://json2jsonp.com/?${qss({ url, callback: '_' })}`)
//     .then(r => r.text())
//     .then(jsonp => JSON.parse(jsonp.replace(/^_\((.*)\)$/, '$1')));

export const autoGet = (url, options) => (canCORS ? get(url, options) : corsGet(url, options));

export const autoGetResp = (url, options) => (canCORS ? getResp(url, options) : corsGetResp(url, options));
