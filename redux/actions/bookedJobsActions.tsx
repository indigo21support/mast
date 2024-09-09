export const SET_BOOKED_JOB_SEARCH = 'SET_BOOKED_JOB_SEARCH';
export const SET_BOOKED_JOB_DATA = 'SET_BOOKED_JOB_DATA';
export const SET_IMAGES = 'SET_IMAGES';

export const setBookedJobSearch = (search: string) => (dispatch: unknown) => {
    dispatch({
        type: SET_BOOKED_JOB_SEARCH,
        payload: search
    });
}

export const setBookedJobData = (data: []) => (dispatch: unknown) => {
    dispatch({
        type: SET_BOOKED_JOB_DATA,
        payload: data
    });
}

export const setImages = (images: []) => (dispatch: unknown) => {
    dispatch({
        type: SET_IMAGES,
        payload: data
    });
}