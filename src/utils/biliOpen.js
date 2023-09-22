import md5 from 'md5';
import { get } from './request';

/**
 * 鉴权加密
 * @param {*} params
 * @param {string} akId
 * @param {string} akSecred
 * @returns
 */
async function getEncodeHeader(body, akId, akSecred) {
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

  const signature = await getHmacSha256(akSecred, data.join('\n'));
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
// const HEARTBEAT_URL = 'https://live-open.biliapi.com/v2/app/heartbeat';
const END_URL = 'https://live-open.biliapi.com/v2/app/end';

async function callApi(url, data, akId, akSecred) {
  const body = JSON.stringify(data);
  const headers = await getEncodeHeader(body, akId, akSecred);
  return get(url, { method: 'POST', headers, body });
}

/**
 * @param {string} akId
 * @param {string} akSecred
 * @param {number} appId
 * @param {string} code
 */
export async function getOpenData(akId, akSecred, appId, code) {
  const { data } = await callApi(START_URL, { code, app_id: appId }, akId, akSecred);
  console.log('open data', data);
  const gameId = data.game_info.game_id;
  if (gameId) {
    callApi(END_URL, { app_id: appId, game_id: data.game_info.game_id }, akId, akSecred).catch(console.error);
  }
  return data;
}
