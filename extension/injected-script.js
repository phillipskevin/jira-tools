(() => {
    const JIRA_URLS = {
        sprint: `/rest/api/2/search?jql=sprint=18`
    };

    const dispatchDataEvent = detail => {
        const ev = new CustomEvent("__ISSUE_TRACKER_TRACKER_EVENT__", {
            detail
        });
        document.dispatchEvent(ev);
    };

    window.__ISSUE_TRACKER_TRACKER_EXTENSION__ = {
        getIssues() {
            fetch(JIRA_URLS.sprint)
                .then((resp) => resp.json())
                .then(({ issues }) => {
					dispatchDataEvent({
						type: "issues",
						data: issues
					});
                });
        }
    };
})();
