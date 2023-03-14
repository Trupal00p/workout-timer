import React, { useCallback, useEffect, useMemo, useReducer, useRef, useContext } from "react";
import produce from "immer";

// EXAMPLE ACTION HANDLER DEFINITION
// {
//   ACTION_NAME:(state, action)=>{
//     return updatedState
//   }
// }

// creates a reducer from the action handlers definitions
export const actionHandlersToReducer = (actionHandlers, getInitialState) => (state, action) => {
  if (!state && getInitialState) state = getInitialState();
  const recipe = actionHandlers[action.type];
  return recipe ? produce(state, recipe(...action.data)) : state;
};

// creates an object of action functions to match the defined action handlers
const actionHandlersToActions = (actionHandlers, dispatch) => {
  return Object.keys(actionHandlers).reduce((acc, actionName) => {
    acc[actionName] = (...args) =>
      dispatch({
        type: actionName,
        data: args,
      });
    return acc;
  }, {});
};

// hook to bring it all together and make available inside components
export const useActionHandlerReducer = (
  actionHandlers,
  initialState,
  initializeState,
  saveState
) => {
  // create reducer function
  const reducer = useCallback(actionHandlersToReducer(actionHandlers), [actionHandlers]);
  // setup state handling
  const [state, dispatch] = useReducer(reducer, initialState, initializeState);
  // create action functions
  const actions = useMemo(
    () => actionHandlersToActions(actionHandlers, dispatch),
    [actionHandlers, dispatch]
  );

  useEffect(() => {
    if (saveState) saveState(state);
  }, [state, saveState]);

  return [state, actions];
};

// EXAMPLE THUNK DEFINITION
// const curriedThunks = {
//   logContext: (actions, getState) => (context) => {
//     console.log(context, actions, getState());
//   },
// };

// hook to allow dispatching of thunks using our object
// of available action functions. To use, pull in right after
// the other hook as below:
//
// const [state, actions] = useActionHandlerReducer(actionHandlers, initialState);
// const thunks = useActionThunks(state, actions, curriedThunks);
//
// thunks.logContext('some context data to log to console in function above')
//
export const useActionThunkDispatcher = (state, actions) => {
  // keep state ref updated
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // callback to get current state
  const getState = useCallback(() => {
    return stateRef.current;
  }, []);
  // function that runs a thunk function with
  // the actions object instead of the bare dispatch
  return useCallback(
    (func) => {
      return func(actions, getState);
    },
    [actions, getState]
  );
};

export const useActionThunks = (state, actions, curriedThunks) => {
  const dispatchThunk = useActionThunkDispatcher(state, actions);
  // process the curried thunk functions into an object so
  // we can run them just like the actions object
  const thunks = useMemo(() => {
    return Object.entries(curriedThunks).reduce((acc, [key, func]) => {
      acc[key] = dispatchThunk(func);
      return acc;
    }, {});
  }, [curriedThunks, dispatchThunk]);

  return thunks;
};

// context handling stuff
const ActionContext = React.createContext();
ActionContext.displayName = "ActionReducerContext";

export const ActionContextProvider = ({
  children,
  actionHandlers,
  initialState,
  curriedThunks = {},
}) => {
  const [state, actions] = useActionHandlerReducer(actionHandlers, initialState);
  const thunks = useActionThunks(state, actions, curriedThunks);
  const value = useMemo(() => [state, actions, thunks], [state, actions, thunks]);
  return <ActionContext.Provider value={value}>{children}</ActionContext.Provider>;
};

export const useActionContext = () => useContext(ActionContext);

// REDUX STUFF
// create store
// store = createStore(actionHandelersToReducer(actionHandlers))
// add store to provider
// useDispatch
// bindActions

// IMMER STUFF
// const su = (draft, data) => {
//   // do updates
// };

// const t = (stateTransformer) => (state, action) =>
//   produce(state, (draftState) => stateTransformer(draftState, action));
