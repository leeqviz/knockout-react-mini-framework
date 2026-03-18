export interface KnockoutComponentMeta<T = unknown> {
  name: string;
  component?: KnockoutComponentTypes.Config<T>;
  lazy?:
    | (() => Promise<{
        default?: KnockoutComponentTypes.Config<T> | undefined;
      }>)
    | undefined;
}
