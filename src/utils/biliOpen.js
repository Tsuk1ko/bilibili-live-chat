import md5 from 'md5';
import { autoGet } from './request';

/**
 * 鉴权加密
 * @param {*} params
 * @param {string} akId
 * @param {string} akSecret
 * @returns
 */
async function getEncodeHeader(body, akId, akSecret) {
  const timestamp = parseInt(Date.now() / 1000 + '');
  const nonce = parseInt(Math.random() * 100000 + '') + timestamp;
  const header = {
    'x-bili-accesskeyid': akId,
    'x-bili-content-md5': md5(body),
    'x-bili-signature-method': 'HMAC-SHA256',
    'x-bili-signature-nonce': nonce + '',
    'x-bili-signature-version': '1.0',
    'x-bili-timestamp': timestamp,
  };
  const data = [];
  for (const key in header) {
    data.push(`${key}:${header[key]}`);
  }

  const signature = await getHmacSha256(akSecret, data.join('\n'));
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...header,
    Authorization: signature,
  };
}

/**
 * HMAC-SHA256加密
 * @param {string} key
 * @param {string} message
 * @returns
 */
async function getHmacSha256(key, message) {
  const encoder = new TextEncoder();
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const START_URL = 'https://live-open.biliapi.com/v2/app/start';
const HEARTBEAT_URL = 'https://live-open.biliapi.com/v2/app/heartbeat';
// const END_URL = 'https://live-open.biliapi.com/v2/app/end';

async function callApi(url, data, akId, akSecret) {
  const body = JSON.stringify(data);
  const headers = await getEncodeHeader(body, akId, akSecret);
  return autoGet(url, { method: 'POST', headers, body });
}

/**
 * @param {string} akId
 * @param {string} akSecret
 * @param {number} appId
 * @param {string} authCode
 */
export async function getOpenData(akId, akSecret, appId, authCode) {
  const startRes = await callApi(START_URL, { code: authCode, app_id: appId }, akId, akSecret);
  console.log('open start', startRes);
  const { code, message, data } = startRes;
  if (code !== 0) throw new Error(message);
  const gameId = data.game_info.game_id;
  if (!gameId) throw new Error('no game id');
  setInterval(async () => {
    const heartbeatRet = await callApi(HEARTBEAT_URL, { game_id: gameId }, akId, akSecret);
    if (heartbeatRet.code === 0) console.log('open heartbeat success');
    else console.error('open heartbeat error', heartbeatRet);
  }, 20e3);
  return data;
}
