let currentTabId = null;
let currentTabUrl = null;
let startTime = null;

const IN_FOCUS = "active";
let browserState = IN_FOCUS;

function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    if (!hostname) return null;
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

async function updateTime() {
  if (currentTabUrl && startTime && browserState === IN_FOCUS) {
    const endTime = Date.now();
    const domain = extractDomain(currentTabUrl);
    if (domain) {
       chrome.storage.local.get(['domainData'], (res) => {
         const domainData = res.domainData || {};
         domainData[domain] = (domainData[domain] || 0) + (endTime - startTime);
         chrome.storage.local.set({ domainData });
       });
    }
  }
  startTime = Date.now();
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateTime();
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    currentTabId = tab.id;
    currentTabUrl = tab.url;
  } catch (e) {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === currentTabId && changeInfo.url) {
    await updateTime();
    currentTabUrl = changeInfo.url;
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await updateTime();
    browserState = "idle";
  } else {
    browserState = IN_FOCUS;
    startTime = Date.now();
  }
});

chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === "active") {
    browserState = IN_FOCUS;
    startTime = Date.now();
  } else {
    await updateTime();
    browserState = "idle";
  }
});
