import { api } from 'api';
import { meta } from 'meta';
import { reducer as toastr } from 'react-redux-toastr';
import {
  defaultState as writeAwayState,
  reducerKey as writeAwayReducerKey,
  reducer as writeAwayReducer,
  IWriteAwayState, externalPieceUpdateAction, setAPIAction, setMetaAction,
} from '@writeaway/core';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import {
  applyMiddleware, combineReducers, AnyAction, createStore, Reducer,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { IApplicationState } from 'types';

export const startStore = () => {
  const appReducer = (state: {} | undefined) => (state || {});

  /**
   * Configure reducers
   */
  const reducers = combineReducers({
    [writeAwayReducerKey as '@writeaway']: writeAwayReducer as Reducer<IWriteAwayState>, // add WriteAway reducer
    toastr, // Optionally add toastr reducer if you use react-redux-toastr.
    // If not, handle react-redux-toastr actions manually in your app to show toasts from WriteAway
    app: appReducer, // Add application specific reducers
  });

  const defaultAppState = {};

  /**
   * Configure initial default state
   */
  const initialState: IApplicationState = {
    [writeAwayReducerKey]: writeAwayState as IWriteAwayState,
    toastr: undefined as any,
    app: defaultAppState,
  };

  // compose middleware
  const middlewares = [
    thunk as ThunkMiddleware, // WriteAway relies on thunk middleware
    // sagaMiddleware, // Add other middlewares if you need them
    // routerMiddleware(history)
  ];
  const enhancers = [applyMiddleware(...middlewares)];
  const store = createStore<IApplicationState, AnyAction, {}, unknown>(
    reducers as any,
    initialState,
    composeWithDevTools({
      name: 'WriteAway React Demo',
      serialize: {
        // eslint-disable-next-line consistent-return
        replacer: (key: string, value: any) => {
          if (value instanceof HTMLElement) { // use your custom data type checker
            return `HTMLElement:${value.tagName}`;
          }
          if (value && value.prototype && value.prototype.isReactComponent) { // use your custom data type checker
            return `IComponent:${(value as any).label}`;
          }
          return value;
        },
      } as any,
    })(...enhancers),
  );

  // Run custom middleware
  // sagaMiddleware.run(rootSaga);

  // If your application supports real-time updates of content, you can call `externalPieceUpdateAction` on store
  // to forcefully update specific piece on page
  // Conflicts are resolved with `resolveConflict` method of API, default takes piece with more recent time of update.
  setInterval(() => {
    store.dispatch(externalPieceUpdateAction({
      id: 'pieceId',
      data: { html: 'I will revert to this string every 10 seconds ' },
      meta: { id: 'timer', label: 'Timer', time: Date.now() },
    }) as any);
  }, 10000);
  /**
   * Setup API
   * Can be done later, but should happen before any editor is activated
   */
  store.dispatch(setAPIAction(api));
  /**
   * Setup user
   * Can be done later, but should happen before any editor is activated
   */
  store.dispatch(setMetaAction(meta));

  return store;
};
