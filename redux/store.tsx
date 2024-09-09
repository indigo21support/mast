import {configureStore} from '@reduxjs/toolkit';
import loginReducer from './reducers/loginReducers.tsx';
import forgotPasswordReducer from './reducers/forgotPasswordReducers.tsx';
import twoFactorAuthReducer from './reducers/twoFactorAuthReducers.tsx';
import loadingReducer from './reducers/loadingReducers.tsx';
import dashboardReducer from './reducers/dashboardReducers.tsx';
import bookedJobsReducer from './reducers/bookedJobsReducers.tsx';
import completedJobsReducer from './reducers/completedJobsReducers.tsx';
import availableJobsReducer from './reducers/availableJobsReducers.tsx';
import surveyQuestionsReducer from './reducers/surveyQuestionsReducers.tsx';
import availableSectionsReducer from './reducers/availableSectionsReducers.tsx';
import geoLocationReducer from './reducers/geoLocationReducers.tsx';

const store = configureStore({
  reducer: {
    login: loginReducer,
    forgotPassword: forgotPasswordReducer,
    twoFactorAuth: twoFactorAuthReducer,
    loading: loadingReducer,
    dashboard: dashboardReducer,
    bookedJob: bookedJobsReducer,
    completedJob: completedJobsReducer,
    availableJob: availableJobsReducer,
    surveyQuestion: surveyQuestionsReducer,
    availableSection: availableSectionsReducer,
    geoLocation: geoLocationReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    immutableCheck: false,
    serializableCheck: false,
  })
});

export default store;
