export enum EntryKind {
  Timer = "timer",
  Set = "set",
  Prepare = "prepare",
  Rest = "rest",
}

export type CompiledTimerConfig = {
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
};

export type CompileSetConfig = {
  kind: EntryKind.Set;
  id: string;
  label: string;
  auto_next?: boolean;
  count?: number;
  components?: Array<CompiledConfigEntry>;
  index?: number;
  prepare_time?: number;
  end_whistle?: boolean;
  breadcrumbs?: string[];
};

export type CompiledConfigEntry = CompiledTimerConfig | CompileSetConfig;

export type TimerConfig = {
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

export type SetConfig = {
  kind: EntryKind.Set;
  id: string;
  label: string;
  auto_next?: boolean;
  count?: number;
  components?: Array<ConfigEntry>;
  index?: number;
  prepare_time?: number;
  end_whistle?: boolean;
  breadcrumbs?: string[];
  open: boolean;
};

export type ConfigEntry = TimerConfig | SetConfig;

export type Config = {
  voice: string;
  title: string;
  definition: ConfigEntry[];
};
