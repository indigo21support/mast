export const SET_SURVEY_QUESTIONS = 'SET_SURVEY_QUESTIONS';
export const SET_LONGITUDE = 'SET_LONGITUDE';
export const SET_LATITUDE = 'SET_LATITUDE';


export const setSurveyQuestions = (questions: []) => (dispatch: unknown) => {
    dispatch({
        type: SET_SURVEY_QUESTIONS,
        payload: questions
    })
};

export const setLatitude = (latitude: string) => (dispatch: unknown) => {
    dispatch({
        type: SET_LATITUDE,
        payload: latitude
    })
};

export const setLongitude = (longitude: string) => (dispatch: unknown) => {
    dispatch({
        type: SET_LONGITUDE,
        payload: longitude
    })
};