const wrapFn = (key) => {
    return (...args) => {
        return new Promise((resolve, reject) => {
			chrome.devtools.inspectedWindow.eval(
				`window.__ISSUE_TRACKER_TRACKER_EXTENSION__.${key}()`,
				function(result, isException) {
					if (isException) {
                        reject(isException);
                        return;
                    }

                    // add resolve handler to some list
                    // so it can be resolved when the value is set
                    // resolve(result);
				}
			);
        });
    };
};

const wrapper = new Proxy({}, {
    get(target, key) {
        return wrapFn(key);
    },
    set(target, key, value) {
        console.log(key, 'set to', value);
        return true;
    }
});

export default wrapper;
