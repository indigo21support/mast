import {
    SET_ACTIVE_TAB
  } from '@redux/actions/dashboardActions.tsx';
  
  const initialState = {
    tab: 'bookedjobs',
  };
  
  const setActiveTab = (state = initialState, action) => {
    switch (action.type) {
      case SET_ACTIVE_TAB:
        return {...state, tab: action.payload};
      default:
        return state;
    }
  };
  
  export default setActiveTab;
  