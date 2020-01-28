const config = require("dotenv").config();
const [ sprintName ] = process.argv.slice(2);

const url = `${process.env.ISSUE_TRACKER_URL}/jira/rest/api/2/search?jql=${sprintName}`;

console.log( url );
