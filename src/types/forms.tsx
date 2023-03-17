export type validator = (val: any, model: { [key: string]: any; }) => string;
export type validationErrors = { [key: string]: string; };
export type FormModel = { [key: string]: any; };
export type actionHandlers = {
  [key: string]: (...args: any[]) => void;
};
export type FormState = {
  model: FormModel;
  touched: { [key: string]: any; };
  errors: validationErrors;
};
