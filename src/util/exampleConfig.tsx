import { Config, EntryKind } from "../types/config";

const basetime = 10;
export const exampleConfig: Config = {
  voice: "somevoiceselection",
  title: "First One",
  definition: [
    {
      kind: EntryKind.Timer,
      duration_seconds: basetime + 25,
      count: 4,
      label: "Plank",
      auto_next: true,
      warnings: [30, 5],
      beep_below: 3,
      prepare_time: 10,
      rest_between_time: 5,
    },
    {
      kind: EntryKind.Set,
      count: 2,
      label: "Core",
      auto_next: true,
      prepare_time: 10,
      components: [
        {
          kind: EntryKind.Timer,
          duration_seconds: basetime + 2,
          label: "Crunches",
          auto_next: true,
          count: 2,
          rest_between_time: 10,
        },
        {
          kind: EntryKind.Timer,
          duration_seconds: basetime + 3,
          label: "Sit ups",
          auto_next: true,
        },
      ],
    },
    {
      kind: EntryKind.Timer,
      duration_seconds: basetime + 4,
      label: "Push ups",
      auto_next: true,
      prepare_time: 20,
      rest_between_time: 30,
      count: 4,
    },
  ],
};
