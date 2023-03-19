export type validator = (val: any, model: { [key: string]: any }) => string;
export type validationErrors = { [key: string]: string };
export type FormModel = { [key: string]: any };

export type FormState<T> = {
  model: T;
  errors: validationErrors;
};
