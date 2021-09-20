# Stateful controller abstract
## @jetsonjs/stateful-controller
### Description

Generic controller class for use as a base for component / chip / module drivers which require a state.

### Dependencies

```
nodejs v14+
typescript 4.4.3

N.B. may work with lower versions, but tested with the above.
```

<strong>Please note: This code has not been verified on any version of windows</strong>

### Installation

```shell
npm install @jetsonjs/stateful-controller
```
or 
```shell
yarn add @jetsonjs/stateful-controller
```

### Example usage

```typescript
import {StatefulController} from "@jetsonjs/stateful-controller";
import {baseProps} from "@jetsonjs/stateful-controller";

interface ModuleProps extends baseProps {
    additionalProp: string;
}

interface ModuleState {
    increment: number
}

export default class ExampleModule extends StatefulController<ModuleProps, ModuleState> {};
```

### Run the tests

```sh
$ npm install
$ npm test
```

### Authors

* **Dan Bowles** - [InteractiveRooster](https://github.com/interactverooster)

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
