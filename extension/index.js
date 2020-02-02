import injectedScript from "../injected-script-wrapper.js";

chrome.runtime.onConnect.addListener((port) => {
	// listen for messages from content-script
	if (port.name === "issue-tracker-tracker") {
        console.log("port connected", port);

		port.onMessage.addListener((msg, port) => {
			const { type, data } = msg;
            injectedScript[type] = data;
		})

		port.onDisconnect.addListener((port) => {
            console.log("port disconnected", port);
		});
	}
});

chrome.devtools.panels.create(
    "Jira Changes",
    "",
    "panel/index.html"
);
