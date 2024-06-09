import {
  getPluginSettings,
  Settings,
  subscribeToSettingsChanges,
} from "../utils/settings.ts";

const OPEN_HOARDER_ID = "open-hoarder";

function checkSettingsState(settings: Settings) {
  if (settings?.address) {
    registerContextMenu();
  } else {
    chrome.contextMenus.remove(OPEN_HOARDER_ID);
  }
}

/**
 * Registers a context menu button to open a tab with the currently configured hoarder instance
 */
function registerContextMenu() {
  chrome.contextMenus.create({
    id: OPEN_HOARDER_ID,
    title: "Open Hoarder",
    contexts: ["action"],
  });
}

/**
 * Reads the current settings and opens a new tab with hoarder
 * @param info the information about the click in the context menu
 */
function handleContextMenuClick(info: chrome.contextMenus.OnClickData) {
  const { menuItemId } = info;
  if (menuItemId === OPEN_HOARDER_ID) {
    getPluginSettings().then((settings: Settings) => {
      chrome.tabs.create({ url: settings.address, active: true });
    });
  }
}

getPluginSettings().then((settings: Settings) => {
  checkSettingsState(settings);
});

subscribeToSettingsChanges((settings) => {
  checkSettingsState(settings);
});

chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
