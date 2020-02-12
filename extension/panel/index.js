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

        statusChanges: {
            value({ listenTo, resolve }) {
                const changes = resolve(new ObservableObject());
                let oldSprints = this.sprints;

                const updateChanges = ({ value: sprints }) => {
                    sprints.forEach((sprint) => {
                        const changesForSprint = new ObservableArray();

                        const oldSprint = oldSprints.find((oldSprint) => oldSprint.id === sprint.id);
                        const oldIssues = oldSprint.issues;

                        sprint.issues.forEach((issue) => {
                            const oldIssue = oldIssues.flattened[issue.key];
                            console.log(issue.key, "OLD status:", oldIssue.fields.status.name, "NEW status:", issue.fields.status.name);
                            if (!oldIssue || oldIssue.fields.status.name !== issue.fields.status.name) {
                                changesForSprint.push(new ObservableObject({
                                    oldStatus: oldIssue.fields.status.name,
                                    newStatus: issue.fields.status.name,
                                    key: issue.key
                                }));
                            }
                        });

                        changes[sprint.id] = changesForSprint;
                    });

                    oldSprints = sprints;
                };

                // set default value
                updateChanges({ value: oldSprints });

                // update value when sprints changes
                listenTo("sprints", updateChanges);
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
