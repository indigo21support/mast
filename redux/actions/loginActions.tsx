
export const SET_USERNAME = 'SET_USERNAME';
export const SET_PASSWORD = 'SET_PASSWORD';

export const setUsername: void = (name: string) => (dispatch: unknown) => {
    dispatch({
      type: SET_USERNAME,
      payload: name,
    });
  };
  
  export const setPassword: void = (password: string) => (dispatch: unknown) => {
    dispatch({
      type: SET_PASSWORD,
      payload: password,
    });
  };