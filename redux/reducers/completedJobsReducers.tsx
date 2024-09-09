import {
    SET_COMPLETED_JOB_SEARCH,
    SET_COMPLETED_JOB_DATA
  } from '@redux/actions/completedJobsActions.tsx';
  
  const initialState = {
    search: '',
    data: []
  };
  
  const completedJobsReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_COMPLETED_JOB_SEARCH:
        return {...state, search: action.payload};
      case SET_COMPLETED_JOB_DATA:
        return {...state, data: action.payload};
      default:
        return state;
    }
  };
  
  export default completedJobsReducer;
  