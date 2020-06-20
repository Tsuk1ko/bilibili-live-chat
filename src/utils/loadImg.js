const loadImg = (url, timeout) =>
  new Promise((resolve, reject) => {
    let progress = 0;
    const xhr = new XMLHttpRequest();
    const loadTimeout = setTimeout(() => {
      xhr.abort();
    }, 10000);
    const progressTimeout = timeout
      ? setTimeout(() => {
          if (progress === 0) xhr.abort();
        }, timeout)
      : null;
    xhr.open('GET', url, true);
    xhr.onprogress = e => {
      if (e.lengthComputable) progress = e.loaded / e.total;
    };
    xhr.onload = () => {
      clearTimeout(progressTimeout);
      clearTimeout(loadTimeout);
      resolve(url);
    };
    xhr.onerror = reject;
    xhr.onabort = reject;
    xhr.send();
  });

export default async loads => {
  for (const [url, timeout] of loads) {
    const loaded = await loadImg(url, timeout).catch(() => {
      console.warn('Timeout', url);
    });
    if (loaded) return loaded;
  }
  return loads[0][0] || '';
};
