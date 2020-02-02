const port = chrome.runtime.connect({ name: "issue-tracker-tracker" });

// listen for events dispatched by injected-script
// and forward them to panel
document.addEventListener("__ISSUE_TRACKER_TRACKER_EVENT__", function(ev) {
	port.postMessage(ev.detail);
});

const s = document.createElement("script");
s.src = chrome.extension.getURL("injected-script.js");
document.body.appendChild(s);
