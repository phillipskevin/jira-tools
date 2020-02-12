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

        async getIssuesForSprint(sprintId) {
            return await fetch(JIRA_URLS.issues(sprintId))
                .then((resp) => resp.json())
                .then(({ issues }) => issues);
        },

        async getIssuesForActiveSprints() {
            const activeSprints = await this.activeSprints;

            return await Promise.all(
                activeSprints.map(async ({ id, name }) => {
                    return {
                        id,
                        name,
                        issues: await this.getIssuesForSprint(id)
                    };
                })
            );
        },

        get sprints() {
            return this.getIssuesForActiveSprints()
                .then((data) => {
                    // TODO - move this to injected-script-wrapper
                    // dispatch will make this value available in the chrome extension
                    dispatchDataResponse({
                        type: "sprints",
                        data: data
                    });
                    return data;
                });
        }
    };
})();
