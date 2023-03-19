import { Config } from "@/types/config";
import {
  ActionDispatchers,
  useActionHandlerReducer,
} from "@/util/actionHandlerReducer";
import { randStr } from "@/util/randStr";
import { encode } from "@/util/useConfig";
import { ClockIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { applyOperation } from "fast-json-patch";
import { useEffect } from "react";

type ConfigFolder = { [key: string]: Config };
type ListState = { configs: ConfigFolder };

const actionHandlers = {
  setConfigs: (newConfigs: ConfigFolder) => (draft: ListState) => {
    draft.configs = newConfigs;
  },
  onDelete: (key: string) => (draft: ListState) => {
    applyOperation(draft, {
      op: "remove",
      path: `/configs/${key}`,
    });
    window.localStorage.setItem("timer-configs", JSON.stringify(draft.configs));
  },
};

export default function Home() {
  const [state, actions]: [ListState, ActionDispatchers] =
    useActionHandlerReducer(actionHandlers, {
      configs: {},
    });

  useEffect(() => {
    actions.setConfigs(
      JSON.parse(window.localStorage.getItem("timer-configs") || "{}")
    );
  }, [actions.setConfigs]);
  return (
    <div className="flex flex-col h-screen">
      <div className="grow bg-slate-100 overflow-auto relative pb-52">
        <div className="max-w-4xl m-auto">
          {Object.entries(state.configs).map(([id, config]) => {
            return (
              <div>
                <span>{config.title}</span>

                <a
                  href={`/#${encode(config)}`}
                  className=" mr-3 underline font-bold cursor-pointer text-slate-400"
                >
                  <ClockIcon title="outline" className="h-5 w-5 mr-2 inline" />
                  <span>Start</span>
                </a>
                <a
                  href={`/edit#${encode(config)}`}
                  className=" mr-3 underline font-bold cursor-pointer text-slate-400"
                >
                  <PencilIcon title="outline" className="h-5 w-5 mr-2 inline" />
                  <span>Edit</span>
                </a>
                <span
                  className=" mr-3 underline font-bold cursor-pointer text-red-400"
                  onClick={() => {
                    actions.onDelete(config.id);
                  }}
                >
                  <TrashIcon title="outline" className="h-5 w-5 mr-2 inline" />
                  <span>Delete</span>
                </span>
              </div>
            );
          })}
        </div>
        <a
          href={`/edit#${encode({
            id: randStr("config"),
            definition: [],
            title: "",
          })}`}
        >
          New
        </a>
      </div>
      {/* <div className="border-solid border-2 border-indigo-600 bg-white fixed bottom-0 left-0 right-0 text-center"></div> */}
    </div>
  );
}
