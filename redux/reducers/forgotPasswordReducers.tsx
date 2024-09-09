import {
  SET_EMAIL,
  SET_OTP,
  SET_PASSWORD,
  SET_PASSWORD_CONFIRMATION
} from '@redux/actions/forgotPasswordActions.tsx';

const initialState = {
  email: null,
  otp: null,
  password: null,
  passwordConfirmation: null,
};

const forgotPasswordReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_EMAIL:
      return {...state, email: action.payload};
    case SET_OTP:
      return {...state, otp: action.payload};
    case SET_PASSWORD:
      return {...state, password: action.payload};
    case SET_PASSWORD_CONFIRMATION:
      return {...state, passwordConfirmation: action.payload};
    default:
      return state;
  }
};

export default forgotPasswordReducer;
