const backgroundScript = chrome.runtime.connect({ name: "jira-tools-content-to-background" });

// listen for events dispatched by injected-script and send them to
// the background script to forward them on to the panel
document.addEventListener("__JIRA_TOOLS_EVENT__", function(ev) {
	backgroundScript.postMessage(ev.detail);
});

const s = document.createElement("script");
s.src = chrome.extension.getURL("injected-script.js");
document.body.appendChild(s);
