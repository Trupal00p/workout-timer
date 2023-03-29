import { generateObjectPaths } from "@/util/generateObjectPaths";
import { lazy } from "@/util/lazy";
import {
  ArrowPathIcon,
  BookmarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  applyOperation,
  applyPatch,
  applyReducer,
  getValueByPointer,
} from "fast-json-patch";
import { cloneDeep } from "lodash";
import { ChangeEvent, useEffect } from "react";
import Button, { LinkButton } from "../components/Button";
import { Input } from "../components/Fields";
import { Component, EntryKind } from "../types/config";
import { FormState } from "../types/forms";
import { useActionHandlerReducer } from "../util/actionHandlerReducer";
import { randStr } from "../util/randStr";
import { encode, useConfig } from "../util/useConfig";

import {
  ArrowTopRightOnSquareIcon,
  FolderIcon,
} from "@heroicons/react/24/solid";
import { ComponentList } from "../components/ComponentList";
import { ExpandControls } from "../components/ExpandControls";
import { Config } from "../types/config";

const setOpenAll =
  (newOpen = false, prefix = "") =>
  (draft: FormState<Config>) => {
    lazy(generateObjectPaths(draft.model))
      .filter(
        (k: string) =>
          k.startsWith(`${prefix}/components`) && k.includes("open")
      )
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
  onSetOpen: (prefix: string, open: boolean) => (draft: FormState<Config>) => {
    applyPatch(draft.model, [
      {
        op: "replace",
        path: `${prefix}/open`,
        value: open,
      },
      {
        op: "replace",
        path: "/scrollIntoView",
        value: open ? prefix : null,
      },
    ]);
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
    config.open = true;
    let pathParts = path.split("/");
    let indexString = pathParts.pop();
    let newIndex = indexString
      ? (parseInt(indexString, 10) + 1).toString()
      : "-";
    pathParts.push(newIndex);
    applyOperation(draft.model, {
      op: "add",
      path: pathParts.join("/"),
      value: config,
    });
  },
  setOpenAll,
  setModel: (model: Config) => (draft: FormState<Config>) => {
    draft.model = model;
  },
  addTimer: (prefix: string) => (draft: FormState<Config>) => {
    // collapse all first
    setOpenAll(false, prefix)(draft);
    // add timer in open state

    const result = applyOperation(draft.model, {
      op: "add",
      path: `${prefix}/components/-`,
      value: {
        kind: EntryKind.Timer,
        id: randStr(EntryKind.Timer),
        auto_next: true,
        open: true,
      },
    });

    applyOperation(draft.model, {
      op: "add",
      // @ts-ignore
      value: `${prefix}/components/${result.index}`,
      path: "/scrollIntoView",
    });
  },
  addSet: (prefix: string) => (draft: FormState<Config>) => {
    setOpenAll(false, prefix)(draft);

    applyOperation(draft.model, {
      op: "add",
      path: `${prefix}/components/-`,
      value: {
        kind: EntryKind.Set,
        id: randStr(EntryKind.Set),
        components: [],
        auto_next: true,
        open: true,
      },
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
            <ExpandControls actions={actions} />
          </div>
          <div className="mr-10 md:m-0">
            <ComponentList
              components={state.model.components}
              state={state}
              actions={actions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
