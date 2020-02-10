const handlerMap = {};

// when a property is read, return a promise that reads that property
// from the injected script and eventually resolves with the value
// of that property
const wrapPropertyInPromiseToFetchData = (key) => {
    return new Promise((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(
            `window.__ISSUE_TRACKER_TRACKER_EXTENSION__.${key}`,
            function(result, isException) {
                if (isException) {
                    reject(isException);
                    return;
                }

                let handlersForKey = handlerMap[key];

                if (!handlersForKey) {
                    handlersForKey = [];
                    handlerMap[key] = handlersForKey;
                }

                handlersForKey.push(resolve);
            }
        );
    });
};

const backgroundScript = chrome.runtime.connect({ name: "issue-tracker-tracker-background-to-panel" });

backgroundScript.onMessage.addListener((msg, port) => {
    const { type, data } = msg;

    let handlersForKey = handlerMap[type];

    if(handlersForKey) {
        handlersForKey.forEach((resolve, index) => {
            resolve(data);
            handlersForKey.splice(index, 1);
        });
    }
});

const wrapper = new Proxy({}, {
    get(target, key) {
        return wrapPropertyInPromiseToFetchData(key);
    }
});

export default wrapper;
