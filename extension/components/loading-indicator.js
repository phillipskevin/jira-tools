import { StacheElement } from "../lib/can.js";

class LoadingIndicator extends StacheElement {
    static view = `
        <div>
            Loading{{ this.dots }}
        <div>
    `;

    static props = {
        numDots: 0,
        get dots() {
            return (new Array(this.numDots)).fill(".").join("");
        }
    };

    connected() {
        this.numDots = 0;

        const int = setInterval(() => {
            if (this.numDots === 3) {
                this.numDots = 0;
            } else {
                this.numDots++;
            }
        }, 500);

        return () => clearInterval(int);
    }
}
customElements.define("loading-indicator", LoadingIndicator);

export default LoadingIndicator;
