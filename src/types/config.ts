export enum EntryKind {
  Timer = "timer",
  Set = "set",
  Prepare = "prepare",
  Rest = "rest",
}

export type ConfigEntry = {
  kind: EntryKind;
  duration_seconds?: number;
  label: string;
  auto_next?: boolean;
  count?: number;
  components?: Array<ConfigEntry>;
  index?: number;
  prepare_time?: number;
  end_whistle?: boolean;
  beep_below?: number;
  rest_between_time?: number;
  warnings?: number[];
  breadcrumbs?: string[];
};

export type Config = {
  voice: string;
  title: string;
  definition: ConfigEntry[];
};
