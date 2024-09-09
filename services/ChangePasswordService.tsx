import * as http from './BaseService.tsx';
import RequestResponse from '@objects/interfaces/RequestResponse.tsx';
import ChangePasswordDto from '@objects/interfaces/ChangePasswordDto.tsx';
import * as storage from '@utils/AppStorage.tsx';

export const setGetResponse: RequestResponse = (status: boolean, obj: unknown) => {
    const response: RequestResponse = {
        status: status,
        message: obj.message,
        token: obj.token
    };

    return response;
};

export const changeUserPassword = (changePasswordDto: ChangePasswordDto) => {
    return http.postRequest('/auth/change-password', changePasswordDto, false).then ( async (response) => {
        await storage.remove('apiRequestError');
        
        await storage.set('accessToken', response.data.token);

        return setGetResponse(true, response.data);
    }).catch( async (error) => {
        console.log(error);
        await storage.set('apiRequestError', JSON.stringify(error));
        return setGetResponse(false, []);
    });   
};