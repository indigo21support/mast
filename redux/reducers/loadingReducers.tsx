import {SET_LOADING} from '@redux/actions/loadingActions.tsx';

const initialState = {
  loading: null,
};

const loadingReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_LOADING:
      return {...state, loading: action.payload};
    default:
      return state;
  }
};

export default loadingReducer;
