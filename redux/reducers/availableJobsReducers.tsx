import {
    SET_AVAILABLE_JOB_SEARCH,
    SET_AVAILABLE_JOB_DATA,
    SET_IMAGES
  } from '@redux/actions/availableJobsActions.tsx';
  
  const initialState = {
    search: '',
    data: [],
  };
  
  const availableJobsReducers = (state = initialState, action) => {
    switch (action.type) {
      case SET_AVAILABLE_JOB_SEARCH:
        return {...state, search: action.payload};
      case SET_AVAILABLE_JOB_DATA:
        return {...state, data: action.payload};
      default:
        return state;
    }
  };
  
  export default availableJobsReducers;
  