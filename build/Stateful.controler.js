"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatefulController = void 0;
const Debug = __importStar(require("debug"));
/**
 * Generic class for inheritance of a module / state dependant controller
 * [[include:Stateful.controller.md]]
 * @typedef genericProps extends baseProps `genericProps`
 * @typedef genericState 'genericState'
 */
class StatefulController {
    /**
     *
     * @param props
     * @param defaultState
     */
    constructor(props, defaultState) {
        /**
         * Map of event listeners
         * @protected
         */
        this.listeners = new Map();
        /**
         * Private map of listeners for internal usage only. Cannot be bound or removed.
         * @private
         */
        this.internalListeners = new Map();
        /**
         *
         * @protected
         */
        this.errorListeners = new Map();
        this.mapped = new Map();
        this.props = props;
        if (defaultState) {
            this.defaultState = defaultState;
        }
        this.tickRate = props.tickRate;
        this.debug = Debug.debug(props.namespace || "debug");
        if (props.debug) {
            Debug.enable(props.namespace || "debug");
        }
        this.on("post", (state) => {
            this.mapped = new Map();
            Object.keys(state).map((key) => {
                this.mapped.set(key, state[key]);
            });
        });
    }
    set defaultState(value) {
        this.state = Object.assign(Object.assign({}, this.state), value);
    }
    onInternal(event, handler, errorHandler) {
        if (event === "error") {
            this.errorListeners.get(handler);
            return;
        }
        let handlers = this.internalListeners.get(event);
        if (!handlers) {
            this.internalListeners.set(event, new Set());
            handlers = this.internalListeners.get(event);
        }
        if (errorHandler) {
            this.errorListeners.set(handler, errorHandler);
        }
        handlers.add(handler);
    }
    on(event, handler) {
        this.debug(`Adding ${event} handler`);
        let handlers = this.listeners.get(event);
        if (!handlers) {
            this.listeners.set(event, new Set());
            handlers = this.listeners.get(event);
        }
        handlers.add(handler);
    }
    off(event, handler) {
        if (!handler) {
            this.listeners.set(event, new Set());
        }
        const handlers = this.listeners.get(event);
        if (!handlers) {
            return;
        }
        handlers.delete(handler);
    }
    get state() {
        return this.current;
    }
    set state(partialState) {
        this.current = Object.assign(Object.assign({}, this.current), partialState);
    }
    get isRunning() {
        return this.timer !== undefined;
    }
    setState(partialState) {
        return __awaiter(this, void 0, void 0, function* () {
            this.stale = Object.assign(Object.assign({}, this.stale), this.current);
            this.next = Object.assign(Object.assign({}, this.next), partialState);
            yield this.emit("pre");
            return this.next;
        });
    }
    setImmediateState(partialState) {
        this.current = Object.assign(Object.assign({}, this.current), partialState);
        this.next = Object.assign(Object.assign({}, this.next), partialState);
        this.stale = Object.assign(Object.assign({}, this.stale), partialState);
        return this.current;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.emit("pre-start");
            this.timer = setInterval(() => this.tick(), this.tickRate);
            yield this.emit("start");
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.emit("pre-stop");
            clearInterval(this.timer);
            this.timer = undefined;
            yield this.emit("stop");
        });
    }
    onError(e) {
        // for ( let evt of this.errorListeners ) {
        //     evt.call( this, e, this.current, this.stale, this.next );
        // }
    }
    emit(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const events = this.listeners.get(event), internal = this.internalListeners.get(event);
            if (!events && !internal) {
                return;
            }
            if (events) {
                for (let evt of events) {
                    try {
                        yield evt.call(this, this.state);
                    }
                    catch (e) {
                        if (event === "error") {
                            throw e;
                        }
                        this.onError(e);
                    }
                }
            }
            if (internal) {
                for (let evt of internal) {
                    try {
                        yield evt.call(this, this.state);
                    }
                    catch (e) {
                        console.error(e);
                        if (event === "error") {
                            throw e;
                        }
                        this.onError(e);
                    }
                }
            }
        });
    }
    tick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.emit("tick");
            this.stale = Object.assign(Object.assign({}, this.stale), this.current);
            this.current = Object.assign(Object.assign({}, this.current), this.next);
            yield this.emit("post");
            yield this.emit("updated");
        });
    }
}
exports.StatefulController = StatefulController;
exports.default = StatefulController;
