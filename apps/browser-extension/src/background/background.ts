import {
  getPluginSettings,
  Settings,
  subscribeToSettingsChanges,
} from "../utils/settings.ts";

const OPEN_HOARDER_ID = "open-hoarder";
const ADD_LINK_TO_HOARDER_ID = "add-link";

function checkSettingsState(settings: Settings) {
  if (settings?.address) {
    registerContextMenus();
  } else {
    removeContextMenus();
  }
}

function removeContextMenus() {
  chrome.contextMenus.remove(OPEN_HOARDER_ID);
  chrome.contextMenus.remove(ADD_LINK_TO_HOARDER_ID);
}

/**
 * Registers
 * * a context menu button to open a tab with the currently configured hoarder instance
 * * a context menu button to add a link to hoarder without loading the page
 */
function registerContextMenus() {
  chrome.contextMenus.create({
    id: OPEN_HOARDER_ID,
    title: "Open Hoarder",
    contexts: ["action"],
  });
  chrome.contextMenus.create({
    id: ADD_LINK_TO_HOARDER_ID,
    title: "Add to Hoarder",
    contexts: ["link"],
  });
}

/**
 * Reads the current settings and opens a new tab with hoarder
 * @param info the information about the click in the context menu
 */
async function handleContextMenuClick(info: chrome.contextMenus.OnClickData) {
  const { menuItemId } = info;
  if (menuItemId === OPEN_HOARDER_ID) {
    getPluginSettings().then((settings: Settings) => {
      chrome.tabs.create({ url: settings.address, active: true });
    });
  } else if (menuItemId === ADD_LINK_TO_HOARDER_ID && info.linkUrl) {
    await chrome.storage.session.set({ url: info.linkUrl });
    await chrome.action.openPopup();
  }
}

getPluginSettings().then((settings: Settings) => {
  checkSettingsState(settings);
});

subscribeToSettingsChanges((settings) => {
  checkSettingsState(settings);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Manifest V3 allows async functions for all callbacks
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
