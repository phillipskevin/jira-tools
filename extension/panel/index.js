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

class IssueTracker extends StacheElement {
    static view = `
       <button on:click="this.getIssues()">Refresh Issues</button>

        <h2>Issues</h2>
        {{# for(issue of issues) }}
            <p>
                {{ issue.key }} {{ issue.fields.summary }} - {{ issue.fields.status.name }}
                {{# if(issue.fields.assignee.displayName) }}({{ issue.fields.assignee.displayName }}){{/ if }}
            </p>
        {{/ for }}
    `;

    static props = {
        issues: type.convert(Issues),

        // TODO  - listen to when `issues` changes
        // and diff statuses
        statusChanges: {
            value({ listenTo, resolve }) {
            }
        }
    }

    async getIssues() {
        this.issues = await jiraData.issues;
    }

    connected() {
        // TODO - load issues from localStorage
        // and set up a listener to set then in localStorage
    }
}
customElements.define("issue-tracker", IssueTracker);
