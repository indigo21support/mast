export const SET_LOADING = 'SET_LOADING';

export const setLoading: void = (loading: boolean) => (dispatch: unknown) => {
    dispatch({
        type: SET_LOADING,
        payload: loading
    })
};