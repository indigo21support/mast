import {
    SET_BOOKED_JOB_SEARCH,
    SET_BOOKED_JOB_DATA,
    SET_IMAGES
  } from '@redux/actions/bookedJobsActions.tsx';
  
  const initialState = {
    search: '',
    data: [],
    images: []
  };
  
  const bookedJobsReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_BOOKED_JOB_SEARCH:
        return {...state, search: action.payload};
      case SET_BOOKED_JOB_DATA:
        return {...state, data: action.payload};
      case SET_IMAGES:
        return {...state, images: action.payload};
      default:
        return state;
    }
  };
  
  export default bookedJobsReducer;
  