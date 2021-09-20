```typescript
import { StatefulController, baseProps } from "@jetsonjs/stateful-controller";

interface ComponentProps extends baseProps {
    address: number;
}

interface ComponentState {
    increment: number;
}

export default class genericComponent extends StatefulController< ComponentProps, ComponentState> {
    
}
```
