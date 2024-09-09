import {
    SET_LATITUDE_LONGITUDE
  } from '@redux/actions/geoLocationActions.tsx';
  
  const initialState = {
    latlong: {
        latitude: 0,
        longitude: 0
    }
  };
  
  const geoLocationReducers = (state = initialState, action) => {
    switch (action.type) {
        
      case SET_LATITUDE_LONGITUDE:
        return {...state, latlong: action.payload};
        
        default:
            return state;
    }
  };
  
  export default geoLocationReducers;
  