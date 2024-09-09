export const SET_AVAILABLE_JOB_SEARCH = ' SET_AVAILABLE_JOB_SEARCH';
export const  SET_AVAILABLE_JOB_DATA = ' SET_AVAILABLE_JOB_DATA';

export const setAvailableJobSearch = (search: string) => (dispatch: unknown) => {
    dispatch({
        type: SET_AVAILABLE_JOB_SEARCH,
        payload: search
    });
}

export const setAvailableJobData = (data: []) => (dispatch: unknown) => {
    dispatch({
        type: SET_AVAILABLE_JOB_DATA,
        payload: data
    });
}