import { AnimatePresence, Reorder } from "framer-motion";
import { Component } from "../types/config";
import { FormState } from "../types/forms";
import { ActionDispatchers } from "../util/actionHandlerReducer";
import { Config } from "../types/config";
import { FormLevel } from "./TimerForm";

export const ComponentList = ({
  components, prefix = "", state, actions,
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
    <Reorder.Group axis="y" values={components} onReorder={onReorder}>
      <AnimatePresence mode="popLayout">
        {components.map((c, i) => {
          const item_prefix = `${prefix}/components/${i}`;
          return (
            <Reorder.Item
              key={c.id}
              value={c}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              dragListener={!c.open}
            >
              <FormLevel
                key={item_prefix}
                entry={c}
                state={state}
                actions={actions}
                prefix={item_prefix} />
            </Reorder.Item>
          );
        })}
      </AnimatePresence>
    </Reorder.Group>
  );
};
