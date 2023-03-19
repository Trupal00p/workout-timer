import { generateObjectPaths } from "@/util/generateObjectPaths";
import { lazy } from "@/util/lazy";
import {
  ArrowPathIcon,
  BookmarkIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  applyOperation,
  applyReducer,
  getValueByPointer,
} from "fast-json-patch";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { cloneDeep } from "lodash";
import { ChangeEvent, useEffect } from "react";
import { Accordion } from "../components/Accordion";
import Button from "../components/Button";
import { Checkbox, Input } from "../components/Fields";
import { ConfigEntry, EntryKind, SetConfig } from "../types/config";
import { FormState } from "../types/forms";
import {
  ActionDispatchers,
  useActionHandlerReducer,
} from "../util/actionHandlerReducer";
import { randStr } from "../util/randStr";
import { encode, useConfig } from "../util/useConfig";

import { Config } from "../types/config";

const actionHandlers = {
  onInputChange:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState<Config>): void => {
      applyOperation(draft.model, {
        op: "replace",
        path: event.target.name,
        value: event.target.value || undefined,
      });
    },
  onCheckboxChange:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState<Config>): void => {
      applyOperation(draft.model, {
        op: "replace",
        path: event.target.name,
        value: event.target.checked,
      });
    },
  onChange: (path: string, value: any) => (draft: FormState<Config>) => {
    applyOperation(draft.model, {
      op: "replace",
      path,
      value,
    });
  },
  onBlur:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState<Config>): void => {
      // console.log(draft.model, event.target.name);
      // draft.touched[event.target.name] = true;
    },
  onDelete: (path: string) => (draft: FormState<Config>) => {
    applyOperation(draft.model, {
      op: "remove",
      path: path,
    });
  },
  onDuplicate: (path: string) => (draft: FormState<Config>) => {
    let config: ConfigEntry = cloneDeep(getValueByPointer(draft.model, path));
    config.id = randStr(config.kind);
    applyOperation(draft.model, {
      op: "add",
      path: path,
      value: config,
    });
  },
  setOpenAll:
    (newOpen = false) =>
    (draft: FormState<Config>) => {
      lazy(generateObjectPaths(draft.model))
        .filter((k: string) => k.endsWith("open"))
        .map((k) => ({
          op: "replace",
          path: k,
          value: newOpen,
        }))
        .reduce(applyReducer, draft.model);
    },
  setModel: (model: Config) => (draft: FormState<Config>) => {
    draft.model = model;
  },
  addTimer: (path: string) => (draft: FormState<Config>) => {
    // collapse all first
    lazy(generateObjectPaths(draft.model))
      .filter((k: string) => k.endsWith("open"))
      .map((k) => ({
        op: "replace",
        path: k,
        value: false,
      }))
      .reduce(applyReducer, draft.model);
    applyOperation(draft.model, {
      op: "add",
      path: path,
      value: {
        kind: EntryKind.Timer,
        id: randStr(EntryKind.Timer),
        auto_next: true,
        open: true,
      },
    });
  },
  addSet: () => (draft: FormState<Config>) => {
    draft.model.definition?.push({
      kind: EntryKind.Set,
      id: randStr(EntryKind.Set),
      label: "",
      open: true,
    });
  },
  onSave: () => (draft: FormState<Config>) => {
    // add id if not defined
    let id = draft.model.id;
    if (!id) {
      id = randStr("config");
      applyOperation(draft.model, {
        op: "replace",
        path: "/id",
        value: id,
      });
    }

    // get current saved values from store
    const savedConfigs: { [key: string]: any } = JSON.parse(
      window.localStorage.getItem("timer-configs") || "{}"
    );

    //update store
    if (draft.model.id) {
      savedConfigs[draft.model.id] = draft.model;
      window.localStorage.setItem(
        "timer-configs",
        JSON.stringify(savedConfigs)
      );

      // set has in address bar
      window.location.hash = encode(draft.model);
    }
  },
};

const TimerForm = ({
  prefix,
  state,
  actions,
}: {
  prefix: string;
  state: FormState<Config>;
  actions: ActionDispatchers;
}) => {
  return (
    <div className="border-solid border-black border-2 rounded-lg shadow-lg m-3 p-3 bg-blue-200">
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
  entry: SetConfig;
  prefix: string;
  state: FormState<Config>;
  actions: ActionDispatchers;
}) => {
  return (
    <div className="border-solid border-black border-2 rounded-lg shadow-lg m-3 p-3 bg-green-100">
      <details className="cursor-pointer">
        <summary>
          {getValueByPointer(state.model, `${prefix}/label`)} (Group)
        </summary>
        <Input
          type="text"
          name={`${prefix}/label`}
          label="Name"
          state={state}
          actions={actions}
          helpText="The name for this exercise. This text will be announced at the beginning"
        />
        <Input
          type="number"
          name={`${prefix}/count`}
          label="Loop Count"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}/prepare_time`}
          label="Prepare Time"
          state={state}
          actions={actions}
        />

        {entry?.components?.map((c, i) => {
          const item_prefix = `${prefix}/components/${i}`;
          return (
            <FormLevel
              key={item_prefix}
              entry={c}
              state={state}
              actions={actions}
              prefix={item_prefix}
            />
          );
        })}
        <Checkbox
          type="checkbox"
          name={`${prefix}/auto_next`}
          label="Auto Next"
          state={state}
          actions={actions}
        />
      </details>
    </div>
  );
};

const FormLevel = ({
  prefix,
  state,
  actions,
  entry,
}: {
  prefix: string;
  state: FormState<Config>;
  actions: ActionDispatchers;
  entry: ConfigEntry;
}): JSX.Element => {
  if (entry.kind === EntryKind.Timer) {
    return <TimerForm prefix={prefix} state={state} actions={actions} />;
  } else if (entry.kind === EntryKind.Set) {
    return (
      <SetForm prefix={prefix} state={state} actions={actions} entry={entry} />
    );
  } else {
    return <div></div>;
  }
};

export default function Home() {
  const [state, actions] = useActionHandlerReducer(actionHandlers, {
    model: {
      definition: [],
    },
  });

  const [config, encode] = useConfig();
  useEffect(() => {
    if (config) {
      actions.setModel(config);
    }
  }, [config, actions.setModel]);
  const start = () => {
    window.location.assign(`/#${encode(state.model)}`);
  };

  const onReorder = (components: Array<ConfigEntry>) => {
    actions.onChange("/definition", components);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* <div className="border-solid border-2 border-indigo-600">top</div> */}
      <div className="grow bg-slate-100 overflow-auto relative pb-52">
        <div className="max-w-4xl m-auto">
          <Input
            type="text"
            name="/title"
            label={
              <span>
                Routine Name
                {config?.id ? (
                  <span className="text-slate-400 text-xs">
                    {" "}
                    ( {config?.id} )
                  </span>
                ) : null}
              </span>
            }
            helpText="Enter a name for this set of exercises."
            state={state}
            actions={actions}
          />
          <div className="m-3">
            <span className="float-right">
              {config?.id ? (
                <span
                  className=" mr-3 underline text-slate-800 font-bold cursor-pointer"
                  onClick={() => {
                    if (config) {
                      actions.setModel(config);
                    }
                  }}
                >
                  <ArrowPathIcon
                    title="outline"
                    className="h-5 w-5 mr-2 inline"
                  />
                  <span>Reset</span>
                </span>
              ) : null}
              <span
                className=" mr-3 underline font-bold cursor-pointer text-red-400"
                onClick={() => {
                  actions.setModel({
                    definition: [],
                  });
                }}
              >
                <TrashIcon title="outline" className="h-5 w-5 mr-2 inline" />
                <span>Clear</span>
              </span>
            </span>
            <span>
              <span
                className=" mr-3 underline text-slate-800 font-bold cursor-pointer"
                onClick={() => actions.setOpenAll(false)}
              >
                <MinusCircleIcon
                  title="outline"
                  className="h-5 w-5 mr-2 inline"
                />
                <span>Collapse All</span>
              </span>
              <span
                className="underline text-slate-800 font-bold cursor-pointer "
                onClick={() => actions.setOpenAll(true)}
              >
                <PlusCircleIcon
                  title="outline"
                  className="h-5 w-5 mr-2 inline"
                />
                <span>Expand All</span>
              </span>
            </span>
          </div>
          <Reorder.Group
            axis="y"
            values={state.model?.definition}
            onReorder={onReorder}
          >
            <AnimatePresence mode="popLayout">
              {state.model?.definition?.map((c: ConfigEntry, i: number) => {
                const item_prefix = `/definition/${i}`;
                return (
                  <Reorder.Item
                    key={c.id}
                    value={c}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    // transition={{ type: "spring" }}
                    dragListener={!c.open}
                  >
                    <FormLevel
                      entry={c}
                      state={state}
                      actions={actions}
                      prefix={item_prefix}
                    />
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
          <motion.div layout className="text-center">
            <Button
              onClick={() => actions.addTimer("/definition/-")}
              content="Add Timer"
              Icon={PlusCircleIcon}
            />
          </motion.div>
        </div>
      </div>
      <div className="border-solid border-2 border-indigo-600 bg-white fixed bottom-0 left-0 right-0 text-center">
        <a href="/open">Open</a>
        <Button onClick={start} content="Start" Icon={PlusCircleIcon} />
        <Button onClick={actions.onSave} content="Save" Icon={BookmarkIcon} />
      </div>
    </div>
  );
}
