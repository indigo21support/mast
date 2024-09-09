import {
  SET_SURVEY_QUESTIONS,
  SET_LONGITUDE,
  SET_LATITUDE,
} from '@redux/actions/surveyQuestionsActions.tsx';

const initialState = {
  questions: [],
  longitude: null,
  latitude: null,
};

const surveyQuestionsReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SURVEY_QUESTIONS:
      return {...state, questions: action.payload};
    case SET_LONGITUDE:
      return {...state, longitude: action.payload};
    case SET_LATITUDE:
      return {...state, latitude: action.payload};
    default:
      return state;
  }
};

export default surveyQuestionsReducer;
