window.onload = () => {
  window.postMessage({ type: "STUDYVERSE_EXT_INSTALLED" }, "*");
};

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "STUDYVERSE_REQ_DATA") {
    chrome.storage.local.get(['domainData'], (result) => {
      window.postMessage({ type: "STUDYVERSE_RES_DATA", data: result.domainData || {} }, "*");
    });
  }
});
