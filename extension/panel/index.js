import jiraData from "../injected-script-wrapper.js";
import LoadingIndicator from "../components/loading-indicator.js";
import {
    StacheElement,
    ObservableArray,
    ObservableObject,
    type
} from "../lib/can.js";

import styles from "./styles.js";

class Status extends ObservableObject {
    static props = {
        name: type.maybe(String)
    };
}

class Assignee extends ObservableObject {
    static props = {
        displayName: type.maybe(String)
    };
}

class Fields extends ObservableObject {
    static props = {
        assignee: type.convert(Assignee),
        description: type.maybe(String),
        summary: type.maybe(String),
        status: type.convert(Status)
    };
}

class Issue extends ObservableObject {
    static props = {
        key: type.maybe(String),
        fields: type.convert(Fields)
    };
}

class Issues extends ObservableArray {
    static items = type.convert(Issue);

    static props = {
        get flattened() {
            return this.reduce((flat, issue) => {
                flat[issue.key] = issue;
                return flat;
            }, {});
        }
    };
}

class Sprint extends ObservableObject {
    static props = {
        id: Number,
        name: String,
        issues: type.convert(Issues)
    };
}

class Sprints extends ObservableArray {
    static items = type.convert(Sprint);
}

class JiraTools extends StacheElement {
    static view = `
        <style>${styles}</style>
       <button on:click="this.getSprints()">Refresh Issues</button>

        {{# if(this.loading) }}
            {{ this.loadingIndicator }}
        {{/ if }}

        <div {{# if(this.loading) }}style="display: none;"{{/ if }}>
            <h2>Active Sprints</h2>

            {{# for(sprint of this.sprints) }}
                <h3>{{ sprint.name }} - <span>{{ sprint.issues.length }} issues</span></h3>

                {{# if(this.statusChanges[sprint.name].length) }}
                    <h4>Recent status changes:</h4>
                    <ul>
                    {{# for(change of this.statusChanges[sprint.name]) }}
                        <li>Issue <a class="issue-link" target="_blank" href="{{ this.baseUrl }}/browse/{{ change.issueKey }}">{{ change.issueKey }}</a> changed from {{ change.oldStatus }} to {{ change.newStatus }}</li>
                        {{! TODO - show who it is assigned to now }}
                    {{/ for }}
                    </ul>
                {{/ if }}
            {{/ for }}
        </div>
    `;

    static props = {
        loading: false,

        loadingIndicator: {
            get default() {
                return new LoadingIndicator();
            }
        },

        sprints: type.convert(Sprints),

        baseUrl: {
            async() {
                return jiraData.baseUrl;
            }
        },

        get issueStatuses() {
            return this.sprints && this.sprints.reduce((statusesBySprint, sprint) => {
                return {
                    ...statusesBySprint,
                    [sprint.name]: sprint.issues&& sprint.issues.reduce((statuses, issue) => {
                        return {
                            ...statuses,
                            [issue.key]: issue.fields.status.name
                        };
                    }, {})
                };
            });
        },

        statusChanges: {
            value({ listenTo, resolve }) {
                resolve([]);

                listenTo("get-sprints", () => {
                    resolve([]);
                });

                let statuses = this.issueStatuses;

                listenTo("issueStatuses", ({ value }) => {
                    if (statuses) {
                        let changes = {};

                        for (let sprintName in value) {
                            let changesForSprint = [];
                            changes[sprintName] = changesForSprint;

                            let sprint = value[sprintName];
                            for (let issueKey in sprint) {
                                const newStatus = sprint[issueKey];
                                const oldStatus = statuses[sprintName][issueKey];

                                if (newStatus !== oldStatus) {
                                    changesForSprint.push({ issueKey, oldStatus, newStatus });
                                }
                            }

                        }

                        resolve(changes);
                    }

                    statuses = value;
                });
            }
        }
    };

    getSprints() {
        this.dispatch("get-sprints");
    }

    connected() {
        const savedSprints = localStorage.getItem("saved-sprints");
        if (savedSprints) {
            this.sprints = JSON.parse(savedSprints);
        }

        this.listenTo("sprints", ({ value }) => {
            localStorage.setItem("saved-sprints", JSON.stringify(value.serialize()));
        })

        this.listenTo("get-sprints", async () => {
            this.loading = true;
            this.sprints.updateDeep(await jiraData.sprints);
            this.loading = false;
        });
    }
}
customElements.define("jira-tools", JiraTools);
