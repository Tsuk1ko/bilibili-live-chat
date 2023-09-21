let canCORS = true;

export const setCors = bool => (canCORS = bool);

export const getResp = url => fetch(url, { referrer: '', referrerPolicy: 'no-referrer' });

export const get = url => getResp(url).then(r => r.json());

export const corsGetResp = url => getResp(`https://api.codetabs.com/v1/proxy/?quest=${url}`);

export const corsGet = url => get(`https://api.codetabs.com/v1/proxy/?quest=${url}`);

// 估计 json2jsonp 被B站拉黑了
// export const corsGet = url =>
//   fetch(`https://json2jsonp.com/?${qss({ url, callback: '_' })}`)
//     .then(r => r.text())
//     .then(jsonp => JSON.parse(jsonp.replace(/^_\((.*)\)$/, '$1')));

export const autoGet = url => (canCORS ? get(url) : corsGet(url));

export const autoGetResp = url => (canCORS ? getResp(url) : corsGetResp(url));
