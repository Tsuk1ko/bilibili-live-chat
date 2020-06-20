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

// 迁移旧设置
// for (const key of ['anchors', 'faces', 'index']) {
//   const setting = storage.getItem(key);
//   if (!setting) continue;
//   storage.removeItem(key);
//   switch (key) {
//     case 'index': {
//       try {
//         const obj = JSON.parse(setting);
//         if (obj) {
//           if (obj.stay) obj.stay *= 1000;
//           sset(key, obj);
//         }
//       } catch (error) {}
//       break;
//     }
//     case 'faces':
//       break;
//     default:
//       storage.setItem(`blc-${key}`, setting);
//       break;
//   }
// }
