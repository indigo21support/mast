export const SET_AVAILABLE_SECTION_SEARCH = 'SET_AVAILABLE_SECTION_SEARCH';
export const SET_AVAILABLE_SECTION_DATA = 'SET_AVAILABLE_SECTION_DATA';

export const setAvailableSectionSearch = (search: string) => (dispatch: unknown) => {
    dispatch({
        type: SET_AVAILABLE_SECTION_SEARCH,
        payload: search
    });
}

export const setAvailableSectionData = (data: []) => (dispatch: unknown) => {
    dispatch({
        type: SET_AVAILABLE_SECTION_DATA,
        payload: data
    });
}