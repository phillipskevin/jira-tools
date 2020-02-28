const stealTools = require("steal-tools");
const globalJS = require("steal-tools/lib/build/helpers/global").js;

const baseNormalize = globalJS.normalize();

const globalBuilds = stealTools.export({
	steal: {
		config: __dirname + "/package.json!npm",
		main: "jira-tools/can",
		map: {
			"can-observable-array": "can-observable-array/dist/can-observable-array",
			"can-observable-object": "can-observable-object/dist/can-observable-object",
			"can-observable-mixin": "can-observable-mixin/dist/mixins",
			"can-stache-element": "can-stache-element/dist/can-stache-element"
		}
	},
	options: {
		useNormalizedDependencies: false,
		verbose: true
	},
	outputs: {
		"+bundled-es core": {
			addProcessShim: true,
			dest: __dirname + "/extension/lib/can.js",
			modules: ["jira-tools/can"],
            minify: true
		}
	}
});

globalBuilds.catch((e) => {
	setTimeout(() => {
		throw e;
	}, 1);
});
