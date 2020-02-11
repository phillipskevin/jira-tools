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
}

class Sprint extends ObservableObject {
    static props = {
        sprintId: type.convert(Number),
        issues: type.convert(Issues)
    };
}

class Sprints extends ObservableArray {
    static items = type.convert(Sprint);
}

class IssueTracker extends StacheElement {
    static view = `
       <button on:click="this.getSprints()">Refresh Issues</button>

        <h2>Active Sprints</h2>
        {{# for(sprint of this.sprints) }}
            <h3>{{ sprint.name }}</h3>
            {{# for(issue of sprint.issues) }}
                <p>
                    {{ issue.key }} {{ issue.fields.summary }} - {{ issue.fields.status.name }}
                    {{# if(issue.fields.assignee.displayName) }}({{ issue.fields.assignee.displayName }}){{/ if }}
                </p>
            {{/ for }}
        {{/ for }}
    `;

    static props = {
        sprints: type.convert(Sprints),

        // TODO  - listen to when `sprints` changes and diff statuses
        statusChanges: {
            value({ listenTo, resolve }) { }
        }
    }

    async getSprints() {
        this.sprints = await jiraData.sprints;
    }

    connected() {
        // TODO - load issues from localStorage
        // and set up a listener to set then in localStorage
    }
}
customElements.define("issue-tracker", IssueTracker);
