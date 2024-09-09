export const SET_OTP = 'SET_OTP';
export const SET_EMAIL = 'SET_EMAIL';

export const setOtp: void = (otp: string) => (dispatch: unknown) => {
    dispatch({
        type: SET_OTP,
        payload: otp
    })
};

export const setEmail: void = (email: string) => (dispatch: unknown) => {
    dispatch({
        type: SET_EMAIL,
        payload: email
    })
};