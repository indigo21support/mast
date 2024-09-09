import { 
  SET_OTP,
  SET_EMAIL
} from '@redux/actions/twoFactorAuthActions.tsx';


const initialState = {
    email: null,
    otp: null
  };
  
  const twoFactorAuthReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_EMAIL:
        return {...state, email: action.payload};
      case SET_OTP:
        return {...state, otp: action.payload};
      default:
        return state;
    }
  };
  
  export default twoFactorAuthReducer;
  