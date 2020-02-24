import jiraData from "../injected-script-wrapper.js";
import {
    StacheElement,
    ObservableArray,
    ObservableObject,
    type
} from "../lib/can.js";

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
       <button on:click="this.getSprints()">Refresh Issues</button>

        <h2>Active Sprints</h2>
        {{# for(sprint of this.sprints) }}
            <h3>{{ sprint.name }}</h3>
            <p>{{ sprint.issues.length }} issues</p>
            <h4>Recent status changes:</h4>
            {{# if(this.statusChanges[sprint.id].length) }}
                {{# for(change of this.statusChanges[sprint.id]) }}
                {{/ for }}
            {{ else }}
                None
            {{/ if }}
        {{/ for }}
    `;

    static props = {
        sprints: type.convert(Sprints),
        // https://codepen.io/kphillips86/pen/JjdEYLP?editors=0010

        get issueStatuses() {
            // TODO - need to go through every sprint
            return this.issues && this.issues.reduce((statuses, issue) => {
                return {
                    ...statuses,
                    [issue.key]: issue.status.name
                };
            }, {});
        },

        statusChanges: {
            value({ listenTo, resolve }) {
                resolve([]);

                listenTo("change-issues", () => {
                    resolve([]);
                });

                let statuses = this.issueStatuses;

                listenTo("issueStatuses", ({ value }) => {
                    if (statuses) {
                        let changes = [];

                        for (let issueKey in value) {
                            const newStatus = value[issueKey];
                            const oldStatus = statuses[issueKey];

                            if (newStatus !== oldStatus) {
                                changes.push({ issueKey, oldStatus, newStatus });
                            }
                        }

                        resolve(changes);
                    }

                    statuses = value;
                });
            }
        }
    }

    async getSprints() {
        this.sprints = await jiraData.sprints;
    }

    connected() {
        const savedSprints = localStorage.getItem("saved-sprints");
        if (savedSprints) {
            this.sprints = JSON.parse(savedSprints);
        }

        this.listenTo("sprints", ({ value }) => {
            localStorage.setItem("saved-sprints", JSON.stringify(value.serialize()));
        })
    }
}
customElements.define("jira-tools", JiraTools);
