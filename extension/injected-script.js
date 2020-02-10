(() => {
    const JIRA_URLS = {
        // get `5` from the rapidView URL param
        activeSprints: `/rest/agile/1.0/board/5/sprint?state=active`,
        // replace `18` with the `id` property from each sprint returned
        // in the activeSprints `values` array
        issues: `/rest/api/2/search?jql=sprint=18`
    };

    const dispatchDataResponse = detail => {
        const ev = new CustomEvent("__ISSUE_TRACKER_TRACKER_RESPONSE__", {
            detail
        });
        document.dispatchEvent(ev);
    };

    window.__ISSUE_TRACKER_TRACKER_EXTENSION__ = {
        get issues() {
            // TODO - get all active sprints and get issues for each
            return fetch(JIRA_URLS.issues)
                .then((resp) => resp.json())
                .then(({ issues }) => {
                    // dispatch will make this value available in the chrome extension
                    dispatchDataResponse({
                        type: "issues",
                        data: issues
                    });
                    return issues;
                });
        }
    };
})();
