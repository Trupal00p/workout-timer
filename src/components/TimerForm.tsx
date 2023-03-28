import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { getValueByPointer } from "fast-json-patch";
import { Accordion } from "./Accordion";
import Button from "./Button";
import { Checkbox, Input } from "./Fields";
import {
  Component,
  EntryKind,
  SetComponent,
  TimerComponent,
} from "../types/config";
import { FormState } from "../types/forms";
import { ActionDispatchers } from "../util/actionHandlerReducer";
import { Config } from "../types/config";
import { ComponentList } from "./ComponentList";
import { ExpandControls } from "./ExpandControls";
import { motion } from "framer-motion";

const TimerForm = ({
  prefix,
  state,
  actions,
  entry,
}: {
  entry: TimerComponent;
  prefix: string;
  state: FormState<Config>;
  actions: ActionDispatchers;
}) => {
  return (
    <div className="border-solid border-black border-2 rounded-lg shadow-lg p-3 bg-blue-200">
      <Accordion
        open={getValueByPointer(state.model, `${prefix}/open`)}
        setOpen={(value) => actions.onChange(`${prefix}/open`, value)}
        summary={<>{getValueByPointer(state.model, `${prefix}/label`)}</>}
        right={
          <>
            <span
              onClick={(event) => {
                actions.onDuplicate(prefix);
              }}
              className="mr-3 underline cursor-pointer text-slate-400 font-bold"
            >
              Duplicate
            </span>
            <span
              onClick={(event) => {
                actions.onDelete(prefix);
              }}
              className="underline cursor-pointer text-red-400 font-bold"
            >
              Delete
            </span>
          </>
        }
      >
        {/* <div>{entry.id}</div> */}
        <Input
          type="text"
          name={`${prefix}/label`}
          label="Name"
          state={state}
          actions={actions}
          helpText="The name for this exercise. This text will be announced at the beginning of the exercise."
        />
        <Input
          type="number"
          name={`${prefix}/duration_seconds`}
          label="Duration (Seconds)"
          state={state}
          actions={actions}
          helpText="Duration of this exercise in seconds."
        />
        <Input
          type="number"
          name={`${prefix}/prepare_time`}
          label="Preparation Time (Seconds)"
          state={state}
          actions={actions}
          helpText="Duration of preparation timer that will be added before this exercise begins."
        />
        <Input
          type="number"
          name={`${prefix}/count`}
          label="Repeat Count"
          state={state}
          actions={actions}
          helpText="Optionally repeat this timer this many times."
        />
        {!!getValueByPointer(state.model, `${prefix}/count`) ? (
          <Input
            type="number"
            name={`${prefix}/rest_between_time`}
            label="Rest Between Time (Seconds)"
            state={state}
            actions={actions}
            helpText="Duration of the rest timers that are added between each repetition of this exercise."
          />
        ) : null}
        <Input
          type="text"
          name={`${prefix}/warnings`}
          label="Call Out Times"
          state={state}
          actions={actions}
          helpText='A comma separated list of times that will call out "X more seconds" while the timer is running. Example: "30, 10, 5"'
        />
        <Input
          type="number"
          name={`${prefix}/beep_below`}
          label="Count Down Last X Seconds"
          state={state}
          actions={actions}
          helpText="A beeper will sound every second towards the end of this timer when there are this many seconds remaining."
        />
        <Checkbox
          type="checkbox"
          name={`${prefix}/end_whistle`}
          label="Play End Sound"
          state={state}
          actions={actions}
          helpText="Play a whistle sound when this exercise completes."
        />
        <Checkbox
          type="checkbox"
          name={`${prefix}/auto_next`}
          label="Auto Next"
          state={state}
          actions={actions}
          helpText="Automatically progress to the next exercise when this one completes."
        />
      </Accordion>
    </div>
  );
};
const SetForm = ({
  entry,
  prefix,
  state,
  actions,
}: {
  entry: SetComponent;
  prefix: string;
  state: FormState<Config>;
  actions: ActionDispatchers;
}) => {
  return (
    <div className="border-solid border-black border-2 rounded-lg shadow-lg p-3 bg-emerald-200">
      <Accordion
        open={getValueByPointer(state.model, `${prefix}/open`)}
        setOpen={(value) => actions.onChange(`${prefix}/open`, value)}
        summary={<>{getValueByPointer(state.model, `${prefix}/label`)}</>}
        right={
          <>
            <span
              onClick={(event) => {
                actions.onDuplicate(prefix);
              }}
              className="mr-3 underline cursor-pointer text-slate-400 font-bold"
            >
              Duplicate
            </span>
            <span
              onClick={(event) => {
                actions.onDelete(prefix);
              }}
              className="underline cursor-pointer text-red-400 font-bold"
            >
              Delete
            </span>
          </>
        }
      >
        {/* <div>{entry.id}</div> */}
        <Input
          type="text"
          name={`${prefix}/label`}
          label="Name"
          state={state}
          actions={actions}
          helpText="The name for this exercise. This text will be announced at the beginning of the exercise."
        />
        <Input
          type="number"
          name={`${prefix}/prepare_time`}
          label="Preparation Time (Seconds)"
          state={state}
          actions={actions}
          helpText="Duration of preparation timer that will be added before this exercise begins."
        />
        <Input
          type="number"
          name={`${prefix}/count`}
          label="Repeat Count"
          state={state}
          actions={actions}
          helpText="Optionally repeat this timer this many times."
        />
        <ExpandControls actions={actions} prefix={prefix} />
        <ComponentList
          components={entry.components}
          prefix={prefix}
          state={state}
          actions={actions}
        />
        <Checkbox
          type="checkbox"
          name={`${prefix}/auto_next`}
          label="Auto Next"
          state={state}
          actions={actions}
          helpText="Automatically progress to the next exercise when this one completes."
        />
      </Accordion>
    </div>
  );
};

export const FormLevel = ({
  prefix,
  state,
  actions,
  entry,
}: {
  prefix: string;
  state: FormState<Config>;
  actions: ActionDispatchers;
  entry: Component;
}): JSX.Element => {
  if (entry.kind === EntryKind.Timer) {
    return (
      <TimerForm
        prefix={prefix}
        state={state}
        actions={actions}
        entry={entry}
      />
    );
  } else if (entry.kind === EntryKind.Set) {
    return (
      <SetForm prefix={prefix} state={state} actions={actions} entry={entry} />
    );
  } else {
    return <div></div>;
  }
};
