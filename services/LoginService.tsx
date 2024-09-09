import * as http from './BaseService.tsx';
import RequestResponse from '@objects/interfaces/RequestResponse.tsx';
import * as storage from '@utils/AppStorage.tsx';
import config from '@config/config.js';

export const setGetResponse: RequestResponse = (status: boolean, obj: unknown) => {
    const response: RequestResponse = {
        status: status,
        message: obj.message,
        token: obj.token
    };

    return response;
};

export const loginUser = (email: string, password: string) => {
    return http.getRequest('/auth/login', {email, password}, false).then ( async (response) => {
        await storage.remove('apiRequestError');

        if (config.enableOtpSecurity === false) {
            await storage.set('accessToken', response.data.token);
        }

        return setGetResponse(true, response.data);
    }).catch( async (error) => {
        console.log(error);
        await storage.set('apiRequestError', JSON.stringify(error));
        return setGetResponse(false, []);
    });   
};