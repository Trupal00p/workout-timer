import { PlusCircleIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { Component, Config } from "../types/config";
import { FormState } from "../types/forms";
import { ActionDispatchers } from "../util/actionHandlerReducer";
import Button from "./Button";
import { FormLevel } from "./TimerForm";

const itemVariants = {
  initial: { opacity: 0, scale: 0.8, height: 0 },
  visible: { opacity: 1, scale: 1, height: "auto" },
  hidden: { opacity: 0, scale: 0, height: 0 },
};

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
  // const { ref, onAnimationComplete } = useScrollAfterAnimate("visible");
  const onReorder = (components: Component[]) => {
    actions.onReorder(prefix, components);
  };
  return (
    <>
      <Reorder.Group
        axis="y"
        values={components}
        onReorder={onReorder}
        className="relative overflow-visible"
      >
        <AnimatePresence initial={false}>
          {components.map((c, i) => {
            const item_prefix = `${prefix}/components/${i}`;
            return (
              <Reorder.Item
                // onAnimationComplete={onAnimationComplete}
                // ref={ref}
                key={c.id}
                value={c}
                variants={itemVariants}
                initial="initial"
                animate="visible"
                exit="hidden"
                dragListener={!c.open}
              >
                <FormLevel
                  key={item_prefix}
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
