export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB';

export const setActiveTab: void = (activeTab: string) => (dispatch: unknown) => {
  dispatch({
    type: SET_ACTIVE_TAB,
    payload: activeTab,
  });
};
