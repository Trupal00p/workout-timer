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
import { motion } from "framer-motion";
import { cloneDeep } from "lodash";
import { ChangeEvent, useEffect } from "react";
import Button, { LinkButton } from "../components/Button";
import { Input } from "../components/Fields";
import { Component, EntryKind } from "../types/config";
import { FormState } from "../types/forms";
import {
  useActionHandlerReducer,
} from "../util/actionHandlerReducer";
import { randStr } from "../util/randStr";
import { encode, useConfig } from "../util/useConfig";

import {
  ArrowTopRightOnSquareIcon,
  FolderIcon,
} from "@heroicons/react/24/solid";
import { Config } from "../types/config";
import { ComponentList } from "../components/ComponentList";

const setOpenAll =
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
  };

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
  onReorder:
    (prefix = "", value: Component[]) =>
    (draft: FormState<Config>) => {
      applyOperation(draft.model, {
        op: "replace",
        path: `${prefix}/components`,
        value,
      });
    },
  onDelete: (path: string) => (draft: FormState<Config>) => {
    applyOperation(draft.model, {
      op: "remove",
      path: path,
    });
  },
  onDuplicate: (path: string) => (draft: FormState<Config>) => {
    let config: Component = cloneDeep(getValueByPointer(draft.model, path));
    config.id = randStr(config.kind);
    applyOperation(draft.model, {
      op: "add",
      path: path,
      value: config,
    });
  },
  setOpenAll,
  setModel: (model: Config) => (draft: FormState<Config>) => {
    draft.model = model;
  },
  addTimer: (path: string) => (draft: FormState<Config>) => {
    // collapse all first
    // setOpenAll(false)(draft);
    // add timer in open state
    applyOperation(draft.model, {
      op: "add",
      path: path,
      value: {
        kind: EntryKind.Timer,
        id: randStr(EntryKind.Timer),
        auto_next: true,
        open: false,
      },
    });
  },
  addSet: () => (draft: FormState<Config>) => {
    draft.model.components?.push({
      kind: EntryKind.Set,
      id: randStr(EntryKind.Set),
      label: "",
      open: true,
      components: [],
      auto_next: true,
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

    setOpenAll(false)(draft);

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

export default function Home() {
  const [state, actions] = useActionHandlerReducer(actionHandlers, {
    model: {
      components: [],
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

  return (
    <div className="flex flex-col h-screen">
      <div className="border-solid border-2 border-indigo-600 bg-white  bottom-0 left-0 right-0 text-center">
        <LinkButton href="/open">
          <FolderIcon className="h-6 w-6 md:mr-3" />
          <span className="hidden md:inline">Open</span>
        </LinkButton>
        <Button onClick={actions.onSave}>
          <BookmarkIcon className="h-6 w-6 md:mr-3" />
          <span className="hidden md:inline">Save</span>
        </Button>
        <Button onClick={start}>
          <ArrowTopRightOnSquareIcon className="h-6 w-6 md:mr-3" />
          <span className="hidden md:inline">Start</span>
        </Button>
      </div>
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
                  <span className="md:inline hidden">Reset</span>
                </span>
              ) : null}
              <span
                className=" mr-3 underline font-bold cursor-pointer text-red-400"
                onClick={() => {
                  actions.setModel({
                    components: [],
                  });
                }}
              >
                <TrashIcon title="outline" className="h-5 w-5 mr-2 inline" />
                <span className="md:inline hidden">Clear</span>
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
                <span className="md:inline hidden">Collapse All</span>
              </span>
              <span
                className="underline text-slate-800 font-bold cursor-pointer "
                onClick={() => actions.setOpenAll(true)}
              >
                <PlusCircleIcon
                  title="outline"
                  className="h-5 w-5 mr-2 inline"
                />
                <span className="md:inline hidden">Expand All</span>
              </span>
            </span>
          </div>
          <ComponentList
            components={state.model.components}
            state={state}
            actions={actions}
          />
          <motion.div layout className="text-center">
            <Button onClick={() => actions.addTimer("/components/-")}>
              <PlusCircleIcon className="h-6 w-6 mr-3" />
              Add Timer
            </Button>
            <Button onClick={() => actions.addSet("/components/-")}>
              <PlusCircleIcon className="h-6 w-6 mr-3" />
              Add Set
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
