import jiraData from "../injected-script-wrapper.js";
import LoadingIndicator from "../components/loading-indicator.js";
import {
  StacheElement,
  ObservableArray,
  ObservableObject,
  type
} from "../lib/can.js";

import styles from "./styles.js";

class StatusField extends ObservableObject {
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
    status: type.convert(StatusField)
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

class Status extends ObservableObject {
  static props = {
    key: String,
    points: type.convert(Number),
    "In Development": type.maybeConvert(String),
    "Review": type.maybeConvert(String),
    "QA": type.maybeConvert(String),
    "UAT": type.maybeConvert(String),
    "Done": type.maybeConvert(String)
  };
}

class Statuses extends ObservableArray {
  static items = type.convert(Status);
}

class Sprint extends ObservableObject {
  static props = {
    id: Number,
    name: String,
    issues: type.convert(Issues),
    statuses: type.convert(Statuses)
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
            <h3>
              {{ sprint.name }} - <span>{{ sprint.issues.length }} issues</span>
            </h3>

            <details>
              <summary>Issue Statuses</summary>
              <table>
                <thead>
                  <td>Issue</td>
                  <td>Story Points</td>
                  <td>Dev Started</td>
                  <td>Ready for Review</td>
                  <td>Ready for QA</td>
                  <td>Ready for UAT</td>
                  <td>Done</td>
                </thead>
                  {{# for(issue of sprint.statuses) }}
                    <tr>
                      <td>{{ issue.key }}</td>
                      <td>{{ issue.points }}</td>
                      <td>{{ this.formatDate(issue["In Development"]) }}</td>
                      <td>{{ this.formatDate(issue["Review"]) }}</td>
                      <td>{{ this.formatDate(issue["QA"]) }}</td>
                      <td>{{ this.formatDate(issue["UAT"]) }}</td>
                      <td>{{ this.formatDate(issue["Done"]) }}</td>
                    </tr>
                  {{/ for }}
                </table>
              </details>

              {{# if(this.statusChanges[sprint.name].length) }}
                <h4>Recent status changes:</h4>
                <ul>
                  {{# for(change of this.statusChanges[sprint.name]) }}
                    <li>Issue <a class="issue-link" target="_blank" rel="noopener" href="{{ this.baseUrl }}/browse/{{ change.issueKey }}">{{ change.issueKey }}</a> changed from {{ change.oldStatus }} ({{ change.oldAssignee }}) to {{ change.newStatus }} ({{ change.newAssignee }})</li>
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
          [sprint.name]: sprint.issues && sprint.issues.reduce((statuses, issue) => {
            return {
              ...statuses,
              [issue.key]: {
                status: issue.fields.status.name,
                assignee: issue.fields.assignee.displayName || "Unassigned"
              }
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
                const newStatus = sprint[issueKey].status;
                const oldStatus = statuses[sprintName] &&
                  statuses[sprintName][issueKey] &&
                  statuses[sprintName][issueKey].status;

                const newAssignee = sprint[issueKey].assignee;
                const oldAssignee = statuses[sprintName] &&
                  statuses[sprintName][issueKey] &&
                  statuses[sprintName][issueKey].assignee;

                if (newStatus !== oldStatus || newAssignee !== oldAssignee) {
                  changesForSprint.push({ issueKey, oldStatus, newStatus, oldAssignee, newAssignee });
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

  connected() {
    const savedSprints = localStorage.getItem("saved-sprints");
    if (savedSprints) {
      this.sprints = JSON.parse(savedSprints);
    }

    this.listenTo("get-sprints", async () => {
      this.loading = true;

      const sprints = await jiraData.sprints;
      if (this.sprints) {
        this.sprints.updateDeep(sprints);
      } else {
        this.sprints = sprints;
      }
      localStorage.setItem("saved-sprints", JSON.stringify(sprints));
      this.loading = false;
    });
  }

  getSprints() {
    this.dispatch("get-sprints");
  }

  formatDate(dateString) {
    if (!dateString) {
      return "";
    }
    const d = new Date(dateString);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getYear() + 1900;
    return `${month}-${day}-${year}`;
  }
}
customElements.define("jira-tools", JiraTools);
