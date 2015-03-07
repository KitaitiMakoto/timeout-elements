"use strict";

(function () {
    var element = Object.create(HTMLAnchorElement.prototype);
    var ownerDocument = document.currentScript.ownerDocument;
    var registry = new WeakMap();
    var defaultTimeout = 3;

    // Should wait for several hundreds milliseconds to start?
    var startCountdown = function startCountdown(event) {
        var props = registry.get(this);
        if (props.state === "counting") {
            return;
        }
        props.state = "counting";
        this.dispatchEvent(new CustomEvent("countdown"));
        if (!isFinite(this.timeout)) {
            return;
        }
        this.showIndicator(event.pageX, event.pageY);
        props.timeoutId = setTimeout(this.click.bind(this), this.timeout * 1000);
    };
    var cancelCountdown = function cancelCountdown(event) {
        var props = registry.get(this);
        if (props.state === "waiting") {
            return;
        }
        props.state = "waiting";
        this.hideIndicator();
        this.dispatchEvent(new CustomEvent("countdowncanceled"));
        clearTimeout(props.timeoutId);
    };

    Object.defineProperties(element, {
        state: {
            enumerable: true,
            get: function get() {
                return registry.get(this).state;
            },
            set: function set(value) {
                switch (value) {
                    case "waiting":
                        startCountdown.bind(this)();
                        break;
                    case "counting":
                        cancelCountdown.bind(this)();
                        break;
                    default:
                        return;
                }
                registry.get(this).state = value;
            }
        },
        timeout: {
            enumerable: true,
            get: function get() {
                return this.getAttribute("timeout");
            },
            set: function set(value) {
                if (isNaN(value)) {
                    return;
                }
                this.setAttribute("timeout", value);
            }
        }
    });

    element.showIndicator = function (x, y) {
        var indicator = this.shadowRoot.getElementsByClassName("indicator")[0];
        var style = getComputedStyle(indicator);
        indicator.style.top = "calc(" + y + "px - 0.5em)";
        indicator.style.left = "calc(" + x + "px - 0.5em)";
        indicator.hidden = false;
    };

    element.hideIndicator = function () {
        this.shadowRoot.getElementsByClassName("indicator")[0].hidden = true;
    };

    element.createdCallback = function () {
        var root = this.createShadowRoot();
        var content = document.createElement("content");
        root.appendChild(content);
    };

    element.attachedCallback = function () {
        registry.set(this, { state: "waiting" });
        var timeout = this.timeout;
        if (timeout === null || isNaN(timeout)) {
            this.timeout = defaultTimeout;
        }
        var indicatorSelector = this.getAttribute("indicator-template");
        var indicatorTemplate;
        if (indicatorSelector) {
            indicatorTemplate = document.querySelector(indicatorSelector);
        }
        if (!indicatorTemplate) {
            var indicatorId = this.getAttribute("indicator");
            indicatorTemplate = ownerDocument.getElementById(indicatorId);
            if (indicatorTemplate === null) {
                indicatorTemplate = ownerDocument.getElementsByTagName("template")[0];
            }
        }
        this.shadowRoot.appendChild(indicatorTemplate.content.cloneNode(true));
        this.addEventListener("mouseover", startCountdown.bind(this));
        this.addEventListener("mouseleave", cancelCountdown.bind(this));
    };

    element.detachedCallback = function () {
        this.removeEventListener("mouseover", startCountdown.bind(this));
        this.removeEventListener("mouseleave", cancelCountdown.bind(this));
        registry["delete"](this);
    };

    element.attributeChangedCallback = function (attrName, oldValue, newValue, namespace) {};

    document.registerElement("timeout-anchor", {
        prototype: element,
        "extends": "a"
    });
})();