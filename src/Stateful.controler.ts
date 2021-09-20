import * as Debug from "debug";

export type stateEvents = "pre"|"post"|"tick"|"error"|"updated"|"start"|"pre-start"|"pre-stop"|"stop";
export type eventHandler<definedState> = (state:definedState, stale?:definedState) => Promise<void>|void
export type errorHandler<definedState> = (error:Error, current:definedState, stale:definedState, next:definedState ) => void;

interface baseProps extends Record<string, any>{
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

class StatefulController<genericProps extends baseProps, genericState> {
    /**
     * Map of event listeners
     * @protected
     */
    protected listeners:Map<stateEvents, Set<eventHandler<genericState>>> = new Map();
    /**
     * Private map of listeners for internal usage only. Cannot be bound or removed.
     * @private
     */
    private internalListeners:Map<stateEvents, Set<eventHandler<genericState>>> = new Map();
    /**
     *
     * @protected
     */
    protected errorListeners:Map<eventHandler<genericState>, errorHandler<genericState>> = new Map();
    protected debug:Debug.Debugger;
    /**
     * Loop resolution in ms. tickRate / 1 second = Hz
     * @protected
     */
    protected readonly tickRate: number;
    /**
     * Loop placeholder
     * @private
     */
    private timer:NodeJS.Timer;
    /**
     * Current state
     * @private
     */
    private current:Partial<genericState>;
    /**
     * State prior to update ( accessor in middleware )
     * @private
     */
    private next:Partial<genericState>;
    /**
     * State after update ( accessor in middleware )
     * @private
     */
    private stale:Partial<genericState>;
    /**
     * Props accessor
     * @readonly
     */
    public readonly props:genericProps;

    private mapped:Map<keyof genericState, any> = new Map();

    private set defaultState( value:Partial<genericState> ) {
        this.state = { ...this.state, ...value } as Partial<genericState>;
    }

    /**
     *
     * @param props
     * @param defaultState
     */
    constructor( props:genericProps, defaultState?:Partial<genericState> ) {

        this.props = props;

        if ( defaultState ) {
            this.defaultState = defaultState;
        }

        this.tickRate = props.tickRate;

        this.debug = Debug.debug( props.namespace || "debug")

        if ( props.debug ) {
            Debug.enable( props.namespace || "debug" );
        }

        this.on( "post", ( state ) => {
            this.mapped = new Map();
            Object.keys( state as genericState ).map( ( key ) => {
                this.mapped.set( key as keyof genericState, state[key])
            })
        } );
    }

    protected onInternal(
        event:stateEvents,
        handler:eventHandler<genericState>,
        errorHandler?:errorHandler<genericState>
    ) {

        if ( event === "error" ) {
            this.errorListeners.get(handler);
            return;
        }

        let
            handlers = this.internalListeners.get( event );

        if ( !handlers ) {
            this.internalListeners.set( event, new Set() );
            handlers = this.internalListeners.get( event );
        }

        if ( errorHandler ) {
            this.errorListeners.set( handler, errorHandler );
        }

        handlers.add( handler as eventHandler<genericState> );
    }


    public on( event:stateEvents, handler:eventHandler<genericState> ) {

        this.debug( `Adding ${event} handler`)

        let
            handlers = this.listeners.get( event );

        if ( !handlers ) {
            this.listeners.set( event, new Set() );
            handlers = this.listeners.get( event );
        }

        handlers.add( handler as eventHandler<genericState> );
    }

    public off( event:stateEvents, handler?:eventHandler<genericState> ) {

        if ( !handler ) {
            this.listeners.set( event, new Set() );
        }

        const
            handlers = this.listeners.get( event );

        if ( !handlers ) {
            return;
        }

        handlers.delete( handler );
    }

    public get state():Partial<genericState> {
        return this.current;
    }

    public set state( partialState:Partial<genericState> ) {
        this.current = { ...this.current, ...partialState }
    }

    protected get isRunning() {
        return this.timer !== undefined;
    }

    public async setState( partialState:Partial<genericState> ):Promise<genericState> {

        this.stale = { ...this.stale, ...this.current };
        this.next = { ...this.next, ...partialState };

        await this.emit( "pre" );

        return this.next as genericState;
    }

    public setImmediateState( partialState:Partial<genericState> ):genericState {

        this.current = { ...this.current, ...partialState };
        this.next = { ...this.next, ...partialState };
        this.stale = { ...this.stale, ...partialState };

        return this.current as genericState;
    }

    public async start() {
        await this.emit( "pre-start" );
        this.timer = setInterval(() => this.tick(), this.tickRate ) as NodeJS.Timer;
        await this.emit( "start" );
    }

    public async stop() {
        await this.emit( "pre-stop" );
        clearInterval( this.timer );
        this.timer = undefined;
        await this.emit( "stop" );
    }

    private onError( e:Error ) {
        // for ( let evt of this.errorListeners ) {
        //     evt.call( this, e, this.current, this.stale, this.next );
        // }
    }

    public async emit( event:stateEvents ) {
        const
            events = this.listeners.get( event ),
            internal = this.internalListeners.get( event );

        if ( !events && !internal ) {
            return;
        }

        if ( events ) {
            for ( let evt of events ) {
                try {
                    await evt.call( this, this.state );
                }
                catch ( e ) {
                    if ( event === "error" ) {
                        throw e;
                    }
                    this.onError( e );
                }
            }
        }

        if ( internal ) {

            for ( let evt of internal ) {

                try {
                    await evt.call( this, this.state );
                }
                catch ( e ) {
                    console.error( e )
                    if ( event === "error" ) {
                        throw e;
                    }
                    this.onError( e );
                }
            }
        }
    }

    private async tick() {

        await this.emit( "tick" );

        this.stale = { ...this.stale, ...this.current };
        this.current = { ...this.current, ...this.next };

        await this.emit( "post" );
        await this.emit( "updated" );
    }
}

export default StatefulController;
export { StatefulController, baseProps };
