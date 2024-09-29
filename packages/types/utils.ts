// This will expand a computed type so you can see the resulting value
export type Expand<T> = {} & { [P in keyof T]: T[P] };
