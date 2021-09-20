import { StatefulController as State, baseProps} from "../src";
import {expect} from "chai";

interface testProps extends baseProps {
    defaultProp?: string;
}

interface testState {
    ran: boolean;
    foo: string;
}

class TestState extends State<testProps, testState> {}

describe('constructor', function() {

    it( "defaults", function () {

        const ts = new TestState({
            tickRate: 200
        }, { foo: "bar"});

        console.log( "ts.props", ts.props );

        expect( ts.state.foo ).to.eq( "bar" );
    })

    it('updates', function() {
        const ts1 = new TestState({
            tickRate: 200
        });

        ts1.on( "updated", () => {
            expect( ts1.state.ran ).to.eq(true );
        } )

        ts1.setState( { ran: true })
    });

    it( "ticks", ( done ) => {
        const ts1 = new TestState({
            tickRate: 200
        });


        ts1.on( "tick", () => {
            expect( true ).to.eq(true );
            ts1.off( "tick" )
            ts1.stop();
            return done();
        } )

        ts1.start();
    })
});
