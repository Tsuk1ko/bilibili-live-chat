import { length as b64len, decode as b64dec } from '@protobufjs/base64';
import { Type, Field } from 'protobufjs';

const decodeB64 = str => {
  const length = b64len(str);
  const buffer = new Uint8Array(length);
  b64dec(str, buffer, 0);
  return buffer;
};

const UserInfo = new Type('UserInfo').add(new Field('face', 4, 'string'));
const DanmakuMessageV2 = new Type('DanmakuMessageV2').add(UserInfo).add(new Field('user', 20, 'UserInfo'));

/**
 * @param {string} str
 * @returns {{ user: { face: string } }}
 */
export const decodeDmV2 = str => {
  const buffer = decodeB64(str);
  return DanmakuMessageV2.decode(buffer);
};
