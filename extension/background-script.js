const toPanelPorts = new Set();

// listen for messages from content-script and pass them on to the panel
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "issue-tracker-tracker-content-to-background") {
        port.onMessage.addListener((msg) => {
            toPanelPorts.forEach((port) => {
                port.postMessage(msg);
            });
        });

        port.onDisconnect.addListener((port) => {
            // TODO
        });
    }

    if (port.name === "issue-tracker-tracker-background-to-panel") {
        toPanelPorts.add(port);

        port.onDisconnect.addListener((port) => {
            toPanelPorts.delete(port);
        });
    }
});
