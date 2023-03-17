import { getValueByPointer } from "fast-json-patch";
import { ChangeEvent } from "react";
import { FormState } from "../types/forms";

export const Input = ({
  name, label, state, actions, type = "text", helpText, ...props
}: {
  name: string;
  label: string;
  state: FormState;
  actions: { [key: string]: (event: ChangeEvent<HTMLInputElement>) => void; };
  type: string;
  helpText?: string;
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
        {...props} />
      {helpText ? (
        <div className="text-indigo-600 text-xs m-1">{helpText}</div>
      ) : null}
    </div>
  );
};
export const Checkbox = ({
  name, label, state, actions, helpText, type = "text", ...props
}: {
  name: string;
  label: string;
  state: FormState;
  actions: { [key: string]: (event: ChangeEvent<HTMLInputElement>) => void; };
  type: string;
  helpText?: string;
}) => {
  return (
    <div className="m-3">
      <div className="flex flex-row items-center justify-start">
        <input
          type={type}
          name={name}
          id={name}
          checked={getValueByPointer(state.model, name) || false}
          onChange={actions.onCheckboxChange}
          onBlur={actions.onBlur}
          {...props} />
        <label className="ml-2 font-bold" htmlFor={name}>
          {label}
        </label>
      </div>
      {helpText ? (
        <div className="text-indigo-600 text-xs m-1">{helpText}</div>
      ) : null}
    </div>
  );
};
