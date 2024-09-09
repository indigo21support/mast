import * as http from './BaseService.tsx';
import RequestResponse from '@objects/interfaces/RequestResponse.tsx';
import * as storage from '@utils/AppStorage.tsx';

export const setGetResponse: RequestResponse = (status: boolean, obj: unknown) => {
    const response: RequestResponse = {
        status: status,
        message: obj.message,
        token: obj.token
    };

    return response;
};

export const verifyUserByEmail = (email: string) => {
    return http.getRequest('/auth/verify-user', {email}, false).then ( async (response) => {
        await storage.remove('apiRequestError');
        console.log(response);
        return setGetResponse(true, response.data);
    }).catch( async (error) => {
        console.log(error);
        await storage.set('apiRequestError', JSON.stringify(error));
        return setGetResponse(false, []);
    });   
};