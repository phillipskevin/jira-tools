import { StacheElement } from "../lib/can.js";
import injectedScript from "../injected-script-wrapper.js";

const toJSON = resp => resp.json();

const styles = `
    issue-tracker-tracker {
        display: block;
        min-width: 400px;
    }
`;

class IssueTrackerTracker extends StacheElement {
    static view = `
        <style>${styles}</style>

        {{# and(issues, issues.length) }}
            loaded
        {{/ and }}
    `;
    static props = {
        issues: {
            async(resolve) {
                injectedScript
                    .getIssues()
                    .then(resolve);
            }
        }
    };
}
customElements.define("issue-tracker-tracker", IssueTrackerTracker);
