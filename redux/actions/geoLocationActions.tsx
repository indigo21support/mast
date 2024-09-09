export const SET_LATITUDE_LONGITUDE = 'SET_LATITUDE_LONGITUDE';

export const setLatitudeLongitude: void = (latlong: object) => (dispatch: unknown) => {
  dispatch({
    type: SET_LATITUDE_LONGITUDE,
    payload: latlong,
  });
};