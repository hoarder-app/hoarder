import {
  BookmarkTypes,
  ZNewBookmarkRequest,
} from "@hoarder/shared/types/bookmarks.ts";

import {
  getPluginSettings,
  Settings,
  subscribeToSettingsChanges,
} from "../utils/settings.ts";
import { NEW_BOOKMARK_REQUEST_KEY_NAME } from "./protocol.ts";

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
    contexts: ["link", "page", "selection", "image"],
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
  } else if (menuItemId === ADD_LINK_TO_HOARDER_ID) {
    let newBookmark: ZNewBookmarkRequest | null = null;
    if (info.linkUrl) {
      newBookmark = {
        type: BookmarkTypes.LINK,
        url: info.linkUrl,
        title: info.selectionText ?? undefined,
      };
    } else if (info.selectionText) {
      newBookmark = {
        type: BookmarkTypes.TEXT,
        text: info.selectionText,
        sourceUrl: info.pageUrl,
      };
    } else if (info.srcUrl ?? info.linkUrl ?? info.pageUrl) {
      newBookmark = {
        type: BookmarkTypes.LINK,
        url: info.srcUrl ?? info.linkUrl ?? info.pageUrl,
      };
    }
    if (newBookmark) {
      chrome.storage.session.set({
        [NEW_BOOKMARK_REQUEST_KEY_NAME]: newBookmark,
      });
      // NOTE: Firefox only allows opening context menus if it's triggered by a user action.
      // awaiting on any promise before calling this function will lose the "user action" context.
      await chrome.action.openPopup();
    }
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
