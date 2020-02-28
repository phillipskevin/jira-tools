const toPanelPorts = new Set();

// listen for messages from content-script and pass them on to the panel
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "jira-tools-content-to-background") {
        port.onMessage.addListener((msg) => {
            toPanelPorts.forEach((port) => {
                port.postMessage(msg);
            });
        });
    }

    if (port.name === "jira-tools-background-to-panel") {
        toPanelPorts.add(port);

        port.onDisconnect.addListener((port) => {
            toPanelPorts.delete(port);
        });
    }
});
