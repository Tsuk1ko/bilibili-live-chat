const storage = window.localStorage;

export const sget = (key, defaultValue = null) => {
  const text = storage.getItem(`blc-${key}`);
  try {
    return text ? JSON.parse(text) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};
export const sset = (key, value) => storage.setItem(`blc-${key}`, JSON.stringify(value));
