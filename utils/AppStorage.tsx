import AsyncStorage from '@react-native-async-storage/async-storage';

export const set: void = async (key, value) => {
  await AsyncStorage.setItem(key, value);
};

export const get: string = async key => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

export const remove: string = async key => {
  try {
    return await AsyncStorage.removeItem(key);
  } catch (e) {
    return null;
  }
};

export const exists: boolean = async key => {
  try {
    const item = await AsyncStorage.getItem(key);
    if (item !== null) {
      return true;
    }
  } catch (e) {
    console.log(e);
  }

  return false;
};
