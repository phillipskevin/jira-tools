(() => {
    const JIRA_URLS = {
        sprint: `/rest/api/2/search?jql=sprint=18`
    };

    const dispatchDataResponse = detail => {
        const ev = new CustomEvent("__ISSUE_TRACKER_TRACKER_RESPONSE__", {
            detail
        });
        document.dispatchEvent(ev);
    };

    window.__ISSUE_TRACKER_TRACKER_EXTENSION__ = {
        get issues() {
            fetch(JIRA_URLS.sprint)
                .then((resp) => resp.json())
                .then(({ issues }) => {
					dispatchDataResponse({
						type: "issues",
						data: issues
					});
                });
        }
    };
})();
