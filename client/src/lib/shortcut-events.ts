export const OPEN_GLOBAL_SEARCH_EVENT = 'fabzclean:open-global-search';
export const REFRESH_DATA_EVENT = 'fabzclean:refresh-data';

export const dispatchShortcutEvent = (eventName: string) => {
  const event = new CustomEvent(eventName, { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};
