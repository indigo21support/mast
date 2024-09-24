
import axios from 'axios';
import AppConfig from '@config/config.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import qs from 'qs';
import * as storage from '@utils/AppStorage';

axios.interceptors.request.use(request => {
  console.log('Starting Request', JSON.stringify(request, null, 2));
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', JSON.stringify(response, null, 2));
  return response;
});

export const initAxiosHttp: unknown = async useUrlEncodeForm => {
  const authorization = await AsyncStorage.getItem('accessToken');

  let objHeader = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (useUrlEncodeForm) {
    objHeader = {
      grant_type: 'password',
      Accept: 'application/x-www-form-urlencoded',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  if (authorization !== null) {
    objHeader['Authorization'] = 'Bearer ' + authorization;
  }

  console.log(AppConfig.baseUrl);
  console.log(JSON.stringify(objHeader));

  const baseUrl = await storage.get('baseUrl');

  const http = axios.create({
    baseURL: baseUrl,
    headers: objHeader,
  });

  return http;
};

export const getRequest: unknown = async (
  url,
  parameters,
  useUrlEncodeForm,
) => {
  const http = await initAxiosHttp(useUrlEncodeForm);

  return http.get(url, {params: parameters});
};

export const postRequest: unknown = async (
  url,
  parameters,
  useUrlEncodeForm,
) => {
  const http = await initAxiosHttp(useUrlEncodeForm);

  return http.post(
    url,
    useUrlEncodeForm ? qs.stringify(parameters) : parameters,
  );
};

export const putRequest: unknown = async (
  url,
  parameters,
  useUrlEncodeForm,
) => {
  const http = await initAxiosHttp(useUrlEncodeForm);

  return http.put(url, parameters);
};

export const deleteRequest: unknown = async (
  url,
  parameters,
  useUrlEncodeForm,
) => {
  const http = await initAxiosHttp(useUrlEncodeForm);

  return http.delete(url, parameters);
};
