import { AnimatePresence, Reorder } from "framer-motion";
import { Component } from "../types/config";
import { FormState } from "../types/forms";
import { ActionDispatchers } from "../util/actionHandlerReducer";
import { Config } from "../types/config";
import { FormLevel } from "./TimerForm";
import { motion } from "framer-motion";
import Button from "./Button";
import { PlusCircleIcon } from "@heroicons/react/24/solid";

export const ComponentList = ({
  components,
  prefix = "",
  state,
  actions,
}: {
  prefix?: string;
  components: Component[];
  state: FormState<Config>;
  actions: ActionDispatchers;
}): JSX.Element => {
  const onReorder = (components: Component[]) => {
    actions.onReorder(prefix, components);
  };
  return (
    <>
      <Reorder.Group
        axis="y"
        // as='div'
        values={components}
        onReorder={onReorder}
        className="relative overflow-visible"
      >
        <AnimatePresence initial={false}>
          {components.map((c, i) => {
            const item_prefix = `${prefix}/components/${i}`;
            return (
              <Reorder.Item
                key={c.id}
                value={c}
                initial={{ opacity: 0, scale: 0.8, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: "auto" }}
                exit={{ opacity: 0, scale: 0, height: 0 }}
                dragListener={!c.open}
              >
                <div className="p-2">
                  <FormLevel
                    key={item_prefix}
                    entry={c}
                    state={state}
                    actions={actions}
                    prefix={item_prefix}
                  />
                </div>
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>
      <motion.div layout className="text-center">
        <Button onClick={() => actions.addTimer(prefix)}>
          <PlusCircleIcon className="h-6 w-6 mr-3" />
          Add Timer
        </Button>
        <Button onClick={() => actions.addSet(prefix)}>
          <PlusCircleIcon className="h-6 w-6 mr-3" />
          Add Set
        </Button>
      </motion.div>
    </>
  );
};
