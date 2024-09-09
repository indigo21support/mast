export const SET_EMAIL = 'SET_EMAIL';
export const SET_OTP = 'SET_OTP';
export const SET_PASSWORD = 'SET_PASSWORD';
export const SET_PASSWORD_CONFIRMATION = 'SET_PASSWORD_CONFIRMATION';

export const setEmail: void = (email: string) => (dispatch: unknown) => {
  dispatch({
    type: SET_EMAIL,
    payload: email,
  });
};

export const setOtp: void = (otp: string) => (dispatch: unknown) => {
  dispatch({
    type: SET_OTP,
    payload: emotpail,
  });
};

export const setPassword: void = (password: string) => (dispatch: unknown) => {
  dispatch({
    type: SET_PASSWORD,
    payload: password,
  });
};

export const setPasswordConfirmation: void = (passwordConfirmation: string) => (dispatch: unknown) => {
    dispatch({
      type: SET_PASSWORD_CONFIRMATION,
      payload: passwordConfirmation,
    });
  };
