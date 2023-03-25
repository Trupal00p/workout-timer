import Button, { LinkButton } from "@/components/Button";
import { Config } from "@/types/config";
import {
  ActionDispatchers,
  useActionHandlerReducer,
} from "@/util/actionHandlerReducer";
import { randStr } from "@/util/randStr";
import { encode } from "@/util/useConfig";
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
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
      <div className="grow  overflow-auto relative pb-52">
        <div className="max-w-4xl m-auto">
          <table className="table-auto border-collapse w-full border border-slate-400 bg-white text-sm shadow-sm">
            <tbody>
              {Object.entries(state.configs).map(([id, config]) => {
                return (
                  <tr key={id}>
                    <td className="border border-slate-300  p-4  text-center">
                      <a
                        href={`/#${encode(config)}`}
                        className="underline font-bold cursor-pointer"
                      >
                        <span>{config.title}</span>
                        <span>
                          <ArrowTopRightOnSquareIcon className="h-6 w-6 ml-1 inline" />
                        </span>
                      </a>
                    </td>
                    <td className="border border-slate-300  p-4 text-center">
                      <LinkButton href={`/edit#${encode(config)}`}>
                        <PencilIcon className="h-6 w-6 md:mr-3" />
                        <span className="hidden md:inline">Edit</span>
                      </LinkButton>
                      <Button
                        onClick={() => {
                          actions.onDelete(config.id);
                        }}
                      >
                        <TrashIcon className="h-6 w-6 md:mr-3" />
                        <span className="hidden md:inline">Delete</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-center">
          <LinkButton
            href={`/edit#${encode({
              id: randStr("config"),
              components: [],
              title: "",
            })}`}
          >
            <PlusCircleIcon className="h-6 w-6 mr-3" />
            New
          </LinkButton>
        </div>
      </div>
      {/* <div className="border-solid border-2 border-indigo-600 bg-white fixed bottom-0 left-0 right-0 text-center"></div> */}
    </div>
  );
}
