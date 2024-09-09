export const SET_COMPLETED_JOB_SEARCH = 'SET_COMPLETED_JOB_SEARCH';
export const SET_COMPLETED_JOB_DATA = 'SET_COMPLETED_JOB_DATA';


export const setCompletedJobSearch = (search: string) => (dispatch: unknown) => {
    dispatch({
        type: SET_COMPLETED_JOB_SEARCH,
        payload: search
    });
}

export const setCompletedJobData = (data: []) => (dispatch: unknown) => {
    dispatch({
        type: SET_COMPLETED_JOB_DATA,
        payload: data
    });
}