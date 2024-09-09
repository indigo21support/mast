import {
    SET_AVAILABLE_SECTION_SEARCH,
    SET_AVAILABLE_SECTION_DATA
  } from '@redux/actions/availableSectionsActions.tsx';
  
  const initialState = {
    search: '',
    data: [],
  };
  
  const availableSectionsReducers = (state = initialState, action) => {
    switch (action.type) {
      case SET_AVAILABLE_SECTION_SEARCH:
        return {...state, search: action.payload};
      case SET_AVAILABLE_SECTION_DATA:
        return {...state, data: action.payload};
      default:
        return state;
    }
  };
  
  export default availableSectionsReducers;
  