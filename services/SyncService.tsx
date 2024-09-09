import * as http from './BaseService.tsx';
import RequestResponse from '@objects/interfaces/RequestResponse.tsx';
import * as storage from '@utils/AppStorage.tsx';
import SyncDataDto from '@objects/dto/SyncDataDto.tsx';
import JobsDao from '@objects/dao/JobsDao.tsx';
import QuestionDao from '@objects/dao/QuestionDao.tsx';
import * as database from '@utils/AppSqliteDb.tsx';

export const setGetResponse: RequestResponse = (status: boolean, obj: unknown) => {
    const response: RequestResponse = {
        status: status,
        message: obj.message,
        token: obj.token
    };

    return response;
};

let syncCounterId = 0;
export const getSyncData = (parameters: SyncDataDto, counter) => {
    console.log('counter is ' + counter);
    return http.getRequest('/sync/get-base-data', parameters, false).then ( async (response) => {
        await storage.remove('apiRequestError');

        let responseData = response.data;

        const jobsDao: JobsDao[] = responseData;

        if (counter === 0) {
            syncCounterId = 1;
            await database.remove('CompletedMemorials', 'id <> ?', ['-1']);
            await database.remove('CompletedMemorialPhotos', 'id <> ?', ['-1']);
        }

        for(const i in jobsDao) {
            jobsDao[i]['id'] = syncCounterId;

            for(const x in jobsDao[i]['completedMemorials']) {
                const obj = jobsDao[i]['completedMemorials'][x];
                await database.insert('CompletedMemorials', obj);
            }

            for(const x in jobsDao[i]['completedMemorialPhotos']) {
                const obj = jobsDao[i]['completedMemorialPhotos'][x];
                await database.insert('CompletedMemorialPhotos', obj);
            }
        
            delete jobsDao[i]['completedMemorials'];
            delete jobsDao[i]['completedMemorialPhotos'];

            await database.insert('jobs', jobsDao[i]);
            syncCounterId++;
        }

        return jobsDao;
    }).catch( async (error) => {
        console.log(error);
        await storage.set('apiRequestError', JSON.stringify(error));
        return setGetResponse(false, []);
    });   
};

export const postSyncData = (syncData: []) => {
    return http.postRequest('/sync/receive-json-data', {syncData: syncData}, false).then ( async (response) => {
        await storage.remove('apiRequestError');
        
        return setGetResponse(true, response.data);
    }).catch( async (error) => {
        console.log(error);
        console.log('/sync/receive-json-data');
        await storage.set('apiRequestError', JSON.stringify(error));
        return setGetResponse(false, []);
    });   
};

export const getMemorialHeights = () => {
    return http.postRequest('/sync/get-memorial-heights', {}, false).then ( async (response) => {
        await storage.remove('apiRequestError');
        
        return response.data;
    }).catch( async (error) => {
        console.log(error);
        await storage.set('apiRequestError', JSON.stringify(error));
        return setGetResponse(false, []);
    });   
};

export const processSendMessage = async (subject, message, memorialId) => {
    return http.postRequest('/sync/send-message', {
        message: message, memorialId: memorialId
    }, false).then ( async (response) => {
        await storage.remove('apiRequestError');
        
        return response.data;
    }).catch( async (error) => {
        console.log(error);
        await storage.set('apiRequestError', JSON.stringify(error));
        return setGetResponse(false, []);
    });   
};

export const processSyncRecords = async () => {
    const results = await database.getRecords(
      'Sync',
      'Status = ? LIMIT 20'
    , ['APPROVED']
    );

    console.log("sync length is " + results.length);

    if(results.length !== 0) {
      const response = await postSyncData(results);

      if (response.status) {
        for(const i in results) {
          const obj = results[i];
          await database.remove('Sync', 'id = ? ', [obj.id]);
        }
      }
    }
  };