(() => {
    const JIRA_URLS = {
        activeSprints: (boardId) => `/rest/agile/1.0/board/${boardId}/sprint?state=active`,
        issues: (sprintId) => `/rest/api/2/search?jql=sprint=${sprintId}`
    };

    const dispatchDataResponse = detail => {
        const ev = new CustomEvent("__ISSUE_TRACKER_TRACKER_RESPONSE__", {
            detail
        });
        document.dispatchEvent(ev);
    };

    window.__ISSUE_TRACKER_TRACKER_EXTENSION__ = {
        get boardId() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get("rapidView");
        },

        get activeSprints() {
            return fetch(JIRA_URLS.activeSprints(this.boardId))
                .then((resp) => resp.json())
                .then(({ values }) => values);
        },

        get issues() {
            // TODO - get all active sprints and get issues for each
            return fetch(JIRA_URLS.issues(18))
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
