const handlerMap = {};

const isPromise = (thing) => {
    return typeof thing === "object" &&
        Object.keys(thing).length === 0;
};

// when a property is read, return a promise that reads that property
// from the injected script and eventually resolves with the value
// of that property
const wrapPropertyInPromiseToFetchData = (key) => {
    return new Promise((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(
            // TODO - change this to check if a promise was returned
            // and then dispatch an event like
            //      dispatchDataResponse({
            //          type: "sprints",
            //          data: data
            //      });
            `window.__JIRA_TOOLS_EXTENSION__.${key}`,
            function(result, isException) {
                if (isException) {
                    reject(isException);
                    return;
                }

                if ( isPromise(result) ) {
                    let handlersForKey = handlerMap[key];

                    if (!handlersForKey) {
                        handlersForKey = [];
                        handlerMap[key] = handlersForKey;
                    }

                    handlersForKey.push(resolve);
                } else {
                    resolve(result);
                }
            }
        );
    });
};

const backgroundScript = chrome.runtime.connect({ name: "jira-tools-background-to-panel" });

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
