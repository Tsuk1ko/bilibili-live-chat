const qrLoginService = 'https://mashir0-bilibili-qr-login.hf.space';

const getCenterPosition = (width, height) => {
  const screenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screen.availLeft;
  const screenTop = window.screenTop !== undefined ? window.screenTop : window.screen.availTop;

  const screenWidth = window.screen.width || window.outerWidth || document.documentElement.clientWidth;
  const screenHeight = window.screen.height || window.outerWidth || document.documentElement.clientHeight;

  return {
    left: Math.round((screenWidth - width) / 2 + screenLeft),
    top: Math.round((screenHeight - height) / 2 + screenTop),
  };
};

const getFeaturesStr = features =>
  Object.entries(features)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');

export const openQrLoginWindow = () => {
  const width = 380;
  const height = 340;
  const features = getFeaturesStr({
    width,
    height,
    location: false,
    menubar: false,
    resizable: false,
    scrollbars: false,
    status: false,
    toolbar: false,
    ...getCenterPosition(width, height),
  });
  return window.open(`${qrLoginService}/?mode=window`, '_blank', features);
};

let handleLogin;

const handleMessage = e => {
  if (e.origin !== qrLoginService) return;
  const { type, data } = e.data;
  if (type === 'success') {
    if (data && typeof data === 'string') handleLogin?.(data);
    e.source?.close();
  }
};

export const bindQrLogin = fn => {
  handleLogin = fn;
  window.addEventListener('message', handleMessage);
};

export const unbindQrLogin = () => {
  handleLogin = null;
  window.removeEventListener('message', handleMessage);
};
