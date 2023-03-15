import { PlusCircleIcon } from "@heroicons/react/24/solid";
import Button from "../components/Button";
import { useConfig } from "../util/useConfig";
import { ConfigEntry, EntryKind } from "../types/config";
import { exampleConfig } from "../util/exampleConfig";
import React, { ChangeEvent, useEffect } from "react";
import { useActionHandlerReducer } from "../util/actionHandlerReducer";
import { Reorder } from "framer-motion";
import sum from "hash-sum";
import { setConfig } from "next/config";
// const voiceOptions = window.speechSynthesis.getVoices().map((v) => {
//   return {
//     value: v.lang,
//     text: v.name,
//   };
// });

// console.log(voiceOptions);

// const compiledConfig = compileConfig(
//   exampleConfig.presets[0].definition,
//   exampleConfig.presets[0].title
// );

// console.log(compiledConfig);

// return {
//   // general actions
//   resetForm: () => (draft) => {
//     draft.model = {};
//     draft.errors = {};
//     draft.localErrors = {};
//     draft.remoteErrors = {};
//     draft.touched = {};
//   },
//   // onblur handlers
//   onFieldBlur:
//     (event, { name, value }) =>
//     (draft) =>
//       onBlur(draft, name, value),
//   onSemanticFieldBlur:
//     (event, { name, value }) =>
//     (draft) =>
//       onBlur(draft, name, value),
//   // onchange handlers

//   onCheckboxFieldChange:
//     (event, { name, checked }) =>
//     (draft) =>
//       onChange(draft, name, checked),
//   onJoditFieldChange: (value, name) => (draft) => onChange(draft, name, value),
//   onButtonClick: (value, data) => (draft) =>
//     onChange(draft, data["data-name"], data["data-clickvalue"]),
//   onFileFieldChange:
//     ({ target: { files, name } }) =>
//     (draft) => {
//       if (files.length > 0) {
//         var reader = new FileReader();
//         reader.readAsDataURL(files[0]);
//         reader.onload = function () {
//           onChange(draft, name, reader.result);
//         };
//         reader.onerror = function (error) {
//           onRemoteError(draft, name, [error]);
//         };
//       }
//     },
//   onSemanticFieldChange:
//     (event, { name, value }) =>
//     (draft) =>
//       onChange(draft, name, value),
//   // utility
//   mergeModel:
//     (newModel, setInitial = false) =>
//     (draft) => {
//       draft.model = { ...draft.model, ...newModel };
//       draft.remoteErrors = {};
//       const localErrors = getFormErrors(validators, model, draft.touched);
//       draft.localErrors = localErrors;
//       draft.errors = localErrors;
//       if (setInitial) {
//         draft.savedModel = JSON.stringify(model);
//       }
//     },
//   setModel: (model) => (draft) => {
//     draft.model = model;
//     draft.remoteErrors = {};
//     const localErrors = getFormErrors(validators, model, draft.touched);
//     draft.localErrors = localErrors;
//     draft.errors = localErrors;
//   },
//   setRemoteErrors: (newErrors) => (draft) => {
//     Object.entries(newErrors).forEach(([name, remoteErrors]) => {
//       onRemoteError(draft, name, remoteErrors);
//     });
//   },
// };

type validator = (val: any, model: { [key: string]: any }) => string;
type validationErrors = { [key: string]: string };
type FormModel = { [key: string]: any };
type actionHandlers = {
  [key: string]: (args: any) => void;
};
type FormState = {
  model: FormModel;
  touched: { [key: string]: any };
  errors: validationErrors;
};

function coerceKey(key: string) {
  const index = parseInt(key, 10);
  return isNaN(index) ? key : index;
}

function randStr(prefix?: string) {
  return Math.random()
    .toString(36)
    .replace("0.", prefix || "");
}

function updateObjectPath(
  object: { [key: string]: any },
  value: any,
  path: string,
  delimiter = "."
) {
  let path_list = path.split(delimiter);

  for (let i = 0; i < path_list.length - 1; i++) {
    const levelKey = coerceKey(path_list[i]);

    if (!object[levelKey]) {
      // determine if array or object needs to be defaulted
      object[levelKey] =
        typeof coerceKey(path_list[i + 1]) === "number" ? [] : {};
    }

    object = object[levelKey];
  }

  object[coerceKey(path_list[path_list.length - 1])] = value;
}
function getObjectPath(
  object: { [key: string]: any },
  path: string,
  delimiter = "."
) {
  let path_list = path.split(delimiter);
  const lastKey = path_list.pop();
  if (lastKey) {
    for (const key of path_list) {
      object = object[coerceKey(key)];
      if (!object) return undefined;
    }

    return object[coerceKey(lastKey)];
  }
}

const actionHandlers = {
  onInputChange:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState): void => {
      updateObjectPath(
        draft.model,
        event.target.value || undefined,
        event.target.name
      );
    },
  onCheckboxChange:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState): void => {
      updateObjectPath(draft.model, event.target.checked, event.target.name);
    },
  onBlur:
    (event: ChangeEvent<HTMLInputElement>) =>
    (draft: FormState): void => {
      draft.touched[event.target.name] = true;
    },
  setModel: (model: FormModel) => (draft: FormState) => {
    draft.model = model;
  },
  addTimer: () => (draft: FormState) => {
    draft.model.definition.push({
      kind: EntryKind.Timer,
      id: randStr(EntryKind.Timer),
    });
  },
  addSet: () => (draft: FormState) => {
    draft.model.definition.push({
      kind: EntryKind.Set,
      id: randStr(EntryKind.Set),
    });
  },
  onUpdateList:
    (path: string, components: Array<ConfigEntry>) => (draft: FormState) => {
      updateObjectPath(draft.model, components, path);
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
        value={getObjectPath(state.model, name) || ""}
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
        checked={getObjectPath(state.model, name) || false}
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

const TimerForm = ({
  entry,
  prefix,
  state,
  actions,
}: {
  entry: ConfigEntry;
  prefix: string;
  state: FormState;
  actions: { [key: string]: (event: ChangeEvent<HTMLInputElement>) => void };
}) => {
  return (
    <div className="border-solid border-black border-2 rounded-lg shadow-lg m-3 p-3">
      <details className="cursor-pointer">
        <summary>
          {getObjectPath(state.model, `${prefix}.label`)} (Exercise)
          <span
            onClick={() => {
              actions.onUpdateList(
                "definition",
                state.model.definition.splice(index, 1)
              );
            }}
            className="underline cursor-pointer text-red-400 float-right"
          >
            Delete
          </span>
        </summary>
        <Input
          type="text"
          name={`${prefix}.label`}
          label="Name"
          state={state}
          actions={actions}
        />
        {/* <Input
          type="text"
          name={`${prefix}.id`}
          label="ID"
          state={state}
          actions={actions}
        /> */}
        <Input
          type="number"
          name={`${prefix}.duration_seconds`}
          label="Duration (Seconds)"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}.count`}
          label="Loop Count"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}.prepare_time`}
          label="Prepare Time"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}.rest_between_time`}
          label="Rest Between Time"
          state={state}
          actions={actions}
        />
        <Input
          type="text"
          name={`${prefix}.warnings`}
          label="Call Out Times"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}.beep_below`}
          label="Count Down Last X Seconds"
          state={state}
          actions={actions}
        />
        <Checkbox
          type="checkbox"
          name={`${prefix}.end_whistle`}
          label="Play End Sound"
          state={state}
          actions={actions}
        />
        <Checkbox
          type="checkbox"
          name={`${prefix}.auto_next`}
          label="Auto Next"
          state={state}
          actions={actions}
        />
        <div className="text-right"></div>
      </details>
    </div>
  );
};

const SetForm = ({
  entry,
  prefix,
  state,
  actions,
}: {
  entry: ConfigEntry;
  prefix: string;
  state: FormState;
  actions: { [key: string]: (event: ChangeEvent<HTMLInputElement>) => void };
}) => {
  return (
    <div className="border-solid border-black border-2 rounded-lg shadow-lg m-3 p-3">
      <details className="cursor-pointer">
        <summary>
          {getObjectPath(state.model, `${prefix}.label`)} (Group)
        </summary>
        <Input
          type="text"
          name={`${prefix}.label`}
          label="Name"
          state={state}
          actions={actions}
        />
        {/* <Input
          type="text"
          name={`${prefix}.id`}
          label="ID"
          state={state}
          actions={actions}
        /> */}
        <Input
          type="number"
          name={`${prefix}.count`}
          label="Loop Count"
          state={state}
          actions={actions}
        />
        <Input
          type="number"
          name={`${prefix}.prepare_time`}
          label="Prepare Time"
          state={state}
          actions={actions}
        />

        {entry?.components?.map((c, i) => {
          const item_prefix = `${prefix}.components.${i}`;
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
          name={`${prefix}.auto_next`}
          label="Auto Next"
          state={state}
          actions={actions}
        />
      </details>
    </div>
  );
};

const FormLevel = (props: {
  prefix: string;
  state: FormState;
  actions: actionHandlers;
  entry: ConfigEntry;
}): JSX.Element => {
  switch (props.entry.kind) {
    case EntryKind.Timer:
      return <TimerForm {...props} />;
    case EntryKind.Set:
      return <SetForm {...props} />;
    default:
      return <div>test</div>;
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

  const config = useConfig();
  useEffect(() => {
    if (config) {
      actions.setModel(config);
    }
  }, [config]);

  const save = () => {
    window.location.assign(`/#${window.btoa(JSON.stringify(state.model))}`);
  };

  const addTime = () => {
    // pass
  };

  const onReorder = (components: Array<ConfigEntry>) => {
    console.log(components);
    actions.onUpdateList("definition", components);
    // "definition", components);
  };

  console.log(state.model);

  return (
    <div className="flex flex-col h-screen">
      {/* <div className="border-solid border-2 border-indigo-600">top</div> */}
      <div className="grow bg-green-100 overflow-auto relative">
        <Input
          type="text"
          name="title"
          label="Routine Name"
          state={state}
          actions={actions}
        />
        <Reorder.Group
          axis="y"
          values={state.model.definition || []}
          onReorder={onReorder}
        >
          {state.model.definition?.map((c, i) => {
            const item_prefix = `definition.${i}`;
            return (
              <Reorder.Item key={c.id} value={c}>
                <FormLevel
                  entry={c}
                  state={state}
                  actions={actions}
                  prefix={item_prefix}
                />
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        {/* <Button
          onClick={actions.addSet}
          content="Add Set"
          Icon={PlusCircleIcon}
        /> */}
        <Button
          onClick={actions.addTimer}
          content="Add Timer"
          Icon={PlusCircleIcon}
        />
      </div>
      <div className="border-solid border-2 border-indigo-600 text-center">
        <Button
          onClick={() => {
            actions.setModel({
              definition: [],
            });
          }}
          content="Reset"
          Icon={PlusCircleIcon}
        />
        <Button onClick={save} content="Start" Icon={PlusCircleIcon} />
      </div>
    </div>
  );
}
