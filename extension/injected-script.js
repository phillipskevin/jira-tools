(() => {
    const JIRA_URLS = {
        activeSprints: (boardId) => `/rest/agile/latest/board/${boardId}/sprint?state=active`,
        issues: (sprintId) => `/rest/api/latest/search?jql=sprint=${sprintId}`,
        changelog: (issueId) => `/rest/api/latest/issue/${issueId}?expand=changelog`
    };

    const dispatchDataResponse = detail => {
        const ev = new CustomEvent("__JIRA_TOOLS_EVENT__", {
            detail
        });
        document.dispatchEvent(ev);
    };

    window.__JIRA_TOOLS_EXTENSION__ = {
        get boardId() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get("rapidView");
        },

        get baseUrl() {
            return window.location.origin;
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
                        issues: await this.getIssuesForSprint(id),
                        statuses: await this.getIssueStatuses(id)
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
        },

        async getIssueChangelog(issueId) {
            return fetch(JIRA_URLS.changelog(issueId))
                .then((resp) => resp.json())
                .then(({ changelog }) => changelog.histories);
        },

        async getIssueStatuses(sprintId) {
            const issues = await this.getIssuesForSprint(sprintId);

            const changelogs = await Promise.all(
                issues.map(async ({ key, fields }) => {
                    return {
                        key,
                        points: fields.customfield_10029 || 0,
                        changelog: await this.getIssueChangelog(key)
                    };
                })
            );

            const issueStatuses = changelogs.map(({ key, points, changelog }) => {
                const statusChanges = { key, points };

                changelog.forEach(({ created, items }) => {
                    items.forEach(({ field, toString }) => {
                        if (field === "status") {
                          statusChanges[toString] = created;
                        }
                    });
                });

                return statusChanges;
            });

            return issueStatuses;
        }
    };
})();
