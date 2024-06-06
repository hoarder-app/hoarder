import { Settings } from "../utils/settings.ts";

const OPEN_HOARDER_ID = "open-hoarder";

function checkSettingsState(settings: Settings) {
  if (settings?.address) {
    registerContextMenu(settings.address);
  } else {
    chrome.contextMenus.remove(OPEN_HOARDER_ID);
  }
}

/**
 * Registers a context menu button to open a tab with the currently configured hoarder instance
 * @param address The address of the configured hoarder instance
 */
function registerContextMenu(address: string) {
  chrome.contextMenus.create({
    id: OPEN_HOARDER_ID,
    title: "Open Hoarder",
    contexts: ["action"],
  });
  chrome.contextMenus.onClicked.addListener(createContextClickHandler(address));
}

/**
 *
 * @param address the address of the hoarder instance
 * @returns an event handler that will open a tab with the hoarder instance
 */
function createContextClickHandler(address: string) {
  return (info: chrome.contextMenus.OnClickData) => {
    const { menuItemId } = info;
    if (menuItemId === OPEN_HOARDER_ID) {
      chrome.tabs.create({ url: address, active: true });
    }
  };
}

chrome.storage.sync.get("settings", (items) =>
  checkSettingsState(items.settings as Settings),
);
chrome.storage.sync.onChanged.addListener((changes) => {
  checkSettingsState(changes.settings.newValue as Settings);
});
