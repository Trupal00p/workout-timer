export enum EntryKind {
  Timer = "timer",
  Set = "set",
  Prepare = "prepare",
  Rest = "rest",
}

export type CompiledTimerComponent = {
  kind: EntryKind.Timer | EntryKind.Prepare | EntryKind.Rest;
  id: string;
  label: string;
  duration_seconds: number;
  auto_next?: boolean;
  count?: number;
  prepare_time?: number;
  end_whistle?: boolean;
  beep_below?: number;
  rest_between_time?: number;
  warnings?: number[];
  breadcrumbs?: string[];
  index?: number;
};

export type CompileSetComponent = {
  kind: EntryKind.Set;
  id: string;
  label: string;
  auto_next?: boolean;
  count?: number;
  components?: Array<CompiledComponent>;
  index?: number;
  prepare_time?: number;
  end_whistle?: boolean;
  breadcrumbs?: string[];
};

export type CompiledComponent = CompiledTimerComponent | CompileSetComponent;

export type TimerComponent = {
  kind: EntryKind.Timer;
  id: string;
  label: string;
  duration_seconds: number;
  auto_next?: boolean;
  count?: number;
  prepare_time?: number;
  end_whistle?: boolean;
  beep_below?: number;
  rest_between_time?: number;
  warnings?: string;
  open: boolean;
};

export type SetComponent = {
  kind: EntryKind.Set;
  id: string;
  label: string;
  components: Array<Component>;
  auto_next: boolean;
  count?: number;
  index?: number;
  prepare_time?: number;
  end_whistle?: boolean;
  breadcrumbs?: string[];
  open: boolean;
};

export type Component = TimerComponent | SetComponent;

export type Config = {
  title: string;
  id?: string;
  scrollIntoView?: string;
  components: Component[];
};
