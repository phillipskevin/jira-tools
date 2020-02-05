import injectedScript from "../injected-script-wrapper.js";

const addP = (msg) => {
    const p = document.createElement("p");
    p.innerHTML = msg;
    document.body.appendChild(p);
};

const button = document.querySelector("button");
button.addEventListener("click", async () => {
    const issues = await injectedScript.issues;
    console.log(issues);
});
