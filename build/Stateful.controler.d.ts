import * as Debug from "debug";
export declare type stateEvents = "pre" | "post" | "tick" | "error" | "updated" | "start" | "pre-start" | "pre-stop" | "stop";
export declare type eventHandler<definedState> = (state: definedState, stale?: definedState) => Promise<void> | void;
export declare type errorHandler<definedState> = (error: Error, current: definedState, stale: definedState, next: definedState) => void;
interface baseProps extends Record<string, any> {
    tickRate: number;
    debug?: boolean;
    namespace?: string;
}
/**
 * Generic class for inheritance of a module / state dependant controller
 * [[include:Stateful.controller.md]]
 * @typedef genericProps extends baseProps `genericProps`
 * @typedef genericState 'genericState'
 */
declare class StatefulController<genericProps extends baseProps, genericState> {
    /**
     * Map of event listeners
     * @protected
     */
    protected listeners: Map<stateEvents, Set<eventHandler<genericState>>>;
    /**
     * Private map of listeners for internal usage only. Cannot be bound or removed.
     * @private
     */
    private internalListeners;
    /**
     *
     * @protected
     */
    protected errorListeners: Map<eventHandler<genericState>, errorHandler<genericState>>;
    protected debug: Debug.Debugger;
    /**
     * Loop resolution in ms. tickRate / 1 second = Hz
     * @protected
     */
    protected readonly tickRate: number;
    /**
     * Loop placeholder
     * @private
     */
    private timer;
    /**
     * Current state
     * @private
     */
    private current;
    /**
     * State prior to update ( accessor in middleware )
     * @private
     */
    private next;
    /**
     * State after update ( accessor in middleware )
     * @private
     */
    private stale;
    /**
     * Props accessor
     * @readonly
     */
    readonly props: genericProps;
    private mapped;
    private set defaultState(value);
    /**
     *
     * @param props
     * @param defaultState
     */
    constructor(props: genericProps, defaultState?: Partial<genericState>);
    protected onInternal(event: stateEvents, handler: eventHandler<genericState>, errorHandler?: errorHandler<genericState>): void;
    on(event: stateEvents, handler: eventHandler<genericState>): void;
    off(event: stateEvents, handler?: eventHandler<genericState>): void;
    get state(): Partial<genericState>;
    set state(partialState: Partial<genericState>);
    protected get isRunning(): boolean;
    setState(partialState: Partial<genericState>): Promise<genericState>;
    setImmediateState(partialState: Partial<genericState>): genericState;
    start(): Promise<void>;
    stop(): Promise<void>;
    private onError;
    emit(event: stateEvents): Promise<void>;
    private tick;
}
export default StatefulController;
export { StatefulController, baseProps };
