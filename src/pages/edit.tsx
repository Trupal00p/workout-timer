import {
  ArrowPathIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { applyPatch, getValueByPointer } from "fast-json-patch";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
} from "framer-motion";
import { ChangeEvent, useEffect, useState } from "react";
import Button from "../components/Button";
import {
  ConfigEntry,
  EntryKind,
  SetConfig,
  TimerConfig,
} from "../types/config";
import { useActionHandlerReducer } from "../util/actionHandlerReducer";
import { randStr } from "../util/randStr";
import { useConfig } from "../util/useConfig";

type validator = (val: any, model: { [key: string]: any }) => string;
type validationErrors = { [key: string]: string };
type FormModel = { [key: string]: any };
type actionHandlers = {
  [key: string]: (...args: any[]) => void;
};
type FormState = {
  model: FormModel;
  touched: { [key: string]: any };
  errors: validationErrors;
};

const actionHandlers = {
  onInputChange:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState): void => {
      applyPatch(draft.model, [
        {
          op: "replace",
          path: event.target.name,
          value: event.target.value || undefined,
        },
      ]);
    },
  onCheckboxChange:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState): void => {
      applyPatch(draft.model, [
        {
          op: "replace",
          path: event.target.name,
          value: event.target.checked,
        },
      ]);
    },
  onChange: (path: string, value: any) => (draft: FormState) => {
    applyPatch(draft.model, [
      {
        op: "replace",
        path,
        value,
      },
    ]);
  },
  onDelete: (path: string) => (draft: FormState) => {
    applyPatch(draft.model, [
      {
        op: "remove",
        path: path,
      },
    ]);
  },
  onBlur:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState): void => {
      draft.touched[event.target.name] = true;
    },
  setModel: (model: FormModel) => (draft: FormState) => {
    draft.model = model;
  },
  addTimer: (path: string) => (draft: FormState) => {
    applyPatch(draft.model, [
      {
        op: "add",
        path: path,
        value: {
          kind: EntryKind.Timer,
          id: randStr(EntryKind.Timer),
          auto_next: true,
        },
      },
    ]);
  },
  addSet: () => (draft: FormState) => {
    draft.model.definition.push({
      kind: EntryKind.Set,
      id: randStr(EntryKind.Set),
    });
  },
  onValidate:
    (validators: { [key: string]: Array<validator> }) => (draft: FormState) => {
      draft.errors = Object.entries(validators).reduce(
        (acc: validationErrors, [key, validator]: any) => {
          acc[key] = validator(draft.model[key], draft.model);
          return acc;
        },
        {}
      );
    },
};

const Input = ({
  name,
  label,
  state,
  actions,
  type = "text",
  ...props
}: {
  name: string;
  label: string;
  state: FormState;
  actions: { [key: string]: (event: ChangeEvent<HTMLInputElement>) => void };
  type: string;
}) => {
  return (
    <div className="m-3">
      <div>
        <label className="font-bold" htmlFor={name}>
          {label}
        </label>
      </div>
      <input
        className="w-full rounded-lg"
        type={type}
        name={name}
        id={name}
        value={getValueByPointer(state.model, name) || ""}
        onChange={actions.onInputChange}
        onBlur={actions.onBlur}
        {...props}
      />
    </div>
  );
};
const Checkbox = ({
  name,
  label,
  state,
  actions,
  type = "text",
  ...props
}: {
  name: string;
  label: string;
  state: FormState;
  actions: { [key: string]: (event: ChangeEvent<HTMLInputElement>) => void };
  type: string;
}) => {
  return (
    <div className="m-3 flex flex-row items-center justify-start">
      <input
        type={type}
        name={name}
        id={name}
        checked={getValueByPointer(state.model, name) || false}
        onChange={actions.onCheckboxChange}
        onBlur={actions.onBlur}
        {...props}
      />
      <label className="ml-2 font-bold" htmlFor={name}>
        {label}
      </label>
    </div>
  );
};

const Accordion = ({
  summary,
  right,
  children,
}: {
  summary: React.ReactNode;
  right: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div
        className="cursor-pointer inline font-bold"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <ChevronDownIcon className="h-4 w-4 inline mr-2" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 inline mr-2" />
        )}
        {summary}
      </div>
      <div className="inline float-right">{right}</div>
      {open ? children : null}
    </div>
  );
};

const TimerForm = ({
  prefix,
  state,
  actions,
  dragControls,
}: {
  prefix: string;
  state: FormState;
  actions: actionHandlers;
  dragControls: any;
}) => {
  return (
    <div className="border-solid border-black border-2 rounded-lg shadow-lg m-3 p-3 bg-blue-200">
      <Accordion
        summary={
          <>{getValueByPointer(state.model, `${prefix}/label`)} (Exercise)</>
        }
        right={
          <>
            <span
              onClick={(event) => {
                actions.onDelete(prefix);
              }}
              className="underline cursor-pointer text-red-400 font-bold"
            >
              Delete
            </span>
            <span
              onPointerDown={(event) => dragControls.start(event)}
              className="ml-10"
            >
              <Bars3Icon className="h-5 w-5 cursor-pointe inline" />
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
        />
        <Input
          type="number"
          name={`${prefix}/duration_seconds`}
          label="Duration (Seconds)"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}/prepare_time`}
          label="Prep Time (Seconds)"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}/count`}
          label="Repeat Count"
          state={state}
          actions={actions}
        />
        {!!getValueByPointer(state.model, `${prefix}/count`) ? (
          <Input
            type="number"
            name={`${prefix}/rest_between_time`}
            label="Rest Between Time (Seconds)"
            state={state}
            actions={actions}
          />
        ) : null}
        <Input
          type="text"
          name={`${prefix}/warnings`}
          label="Call Out Times"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}/beep_below`}
          label="Count Down Last X Seconds"
          state={state}
          actions={actions}
        />
        <Checkbox
          type="checkbox"
          name={`${prefix}/end_whistle`}
          label="Play End Sound"
          state={state}
          actions={actions}
        />
        <Checkbox
          type="checkbox"
          name={`${prefix}/auto_next`}
          label="Auto Next"
          state={state}
          actions={actions}
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
  state: FormState;
  actions: { [key: string]: (event: ChangeEvent<HTMLInputElement>) => void };
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
  dragControls,
}: {
  prefix: string;
  state: FormState;
  actions: actionHandlers;
  entry: ConfigEntry;
  dragControls: any;
}): JSX.Element => {
  if (entry.kind === EntryKind.Timer) {
    return (
      <TimerForm
        prefix={prefix}
        state={state}
        actions={actions}
        dragControls={dragControls}
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

export default function Home() {
  const [state, actions] = useActionHandlerReducer(actionHandlers, {
    model: {
      definition: [],
    },
    touched: {},
    errors: {},
  });

  const [config, encode] = useConfig();
  useEffect(() => {
    if (config) {
      actions.setModel(config);
    }
  }, [config, actions.setModel]);

  const save = () => {
    window.location.assign(`/#${encode(state.model)}`);
  };

  const onReorder = (components: Array<ConfigEntry>) => {
    actions.onChange("/definition", components);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* <div className="border-solid border-2 border-indigo-600">top</div> */}
      <div className="grow bg-slate-100 overflow-auto relative">
        <Input
          type="text"
          name="/title"
          label="Routine Name"
          state={state}
          actions={actions}
        />
        <Reorder.Group
          axis="y"
          values={state.model.definition}
          onReorder={onReorder}
        >
          <AnimatePresence mode="popLayout">
            {state.model.definition?.map((c: ConfigEntry, i: number) => {
              const item_prefix = `/definition/${i}`;
              return (
                <ConfigFormEntry
                  c={c}
                  key={c.id}
                  state={state}
                  actions={actions}
                  item_prefix={item_prefix}
                />
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
      <div className="border-solid border-2 border-indigo-600 text-center">
        <Button
          onClick={() => {
            actions.setModel({
              definition: [],
            });
          }}
          content="Clear"
          Icon={TrashIcon}
        />
        <Button
          onClick={() => {
            actions.setModel(config);
          }}
          content="Reset"
          Icon={ArrowPathIcon}
        />
        <Button onClick={save} content="Start" Icon={PlusCircleIcon} />
      </div>
    </div>
  );
}
function ConfigFormEntry({
  c,
  state,
  actions,
  item_prefix,
}: {
  c: ConfigEntry;
  state: any;
  actions: any;
  item_prefix: string;
}): JSX.Element {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      key={c.id}
      value={c}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring" }}
      dragListener={false}
      // dragControls={dragControls}
    >
      <FormLevel
        entry={c}
        state={state}
        actions={actions}
        prefix={item_prefix}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
}
