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

export const verifyOtp = (email: string, otp: string) => {
    return http.postRequest('/auth/verify-otp', {email, otp}, false).then ( async (response) => {
        await storage.remove('apiRequestError');
        
        await storage.set('accessToken', response.data.token);
        await storage.set('user', JSON.stringify(response.data.user));
        await storage.set('inspector', JSON.stringify(response.data.inspector));

        return setGetResponse(true, response.data);
    }).catch( async (error) => {
        console.log(error);
        await storage.set('apiRequestError', JSON.stringify(error));
        return setGetResponse(false, []);
    });   
};