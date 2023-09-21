// const NO_FACE = 'https://i0.hdslb.com/bfs/face/member/noface.jpg';

// 不用缓存了
window.localStorage.removeItem('blc-face');

export const getFaceLoads = face => {
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
