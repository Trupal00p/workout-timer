import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { ActionDispatchers } from "../util/actionHandlerReducer";

export const ExpandControls = ({
  actions,
  prefix = "",
}: {
  actions: ActionDispatchers;
  prefix?: string;
}) => {
  return (
    <span>
      <span
        className=" mr-3 underline text-slate-800 font-bold cursor-pointer"
        onClick={() => actions.setOpenAll(false, prefix)}
      >
        <MinusCircleIcon title="outline" className="h-5 w-5 mr-2 inline" />
        <span className="md:inline hidden">Collapse All</span>
      </span>
      <span
        className="underline text-slate-800 font-bold cursor-pointer "
        onClick={() => actions.setOpenAll(true, prefix)}
      >
        <PlusCircleIcon title="outline" className="h-5 w-5 mr-2 inline" />
        <span className="md:inline hidden">Expand All</span>
      </span>
    </span>
  );
};
