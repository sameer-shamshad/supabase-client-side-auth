import { assign, fromPromise, setup } from "xstate";
import { checkSession as checkSessionApi } from "../services/auth.service";

const getInitialContext = () => {
  return {
    isLoading: false,
    isAuthenticated: false,
  };
};

const authMachine = setup({
  types: {
    context: {} as {
      isLoading: boolean;
      isAuthenticated: boolean;
    },
    events: {} as
      | { type: 'LOGOUT' }
      | { type: 'SET_AUTHENTICATED' }
  },
  actors: {
    checkSession: fromPromise(async () => { // Check Firebase Auth session directly
      const isAuthenticated = await checkSessionApi();
      return { isAuthenticated };
    }),
  },
  actions: {
    setAuthenticated: assign(({ context, event }) => {
      const output = (event as unknown as { output: { isAuthenticated: boolean } }).output;

      return { ...context, isAuthenticated: output.isAuthenticated, isLoading: false };
    }),
    clearAuth: assign(({ context }) => ({ ...context, isLoading: false, isAuthenticated: false })),
    logout: assign(({ context }) => ({ ...context, isAuthenticated: false, isLoading: false })),
  },
  guards: {
    isAuthenticated: ({ event }) => {
      const output = (event as unknown as { output: { isAuthenticated: boolean } }).output;
      return output?.isAuthenticated === true;
    },
  },
}).createMachine({
  id: 'authMachine',
  initial: 'checking',
  context: getInitialContext(),
  states: {
    checking: {
      entry: assign(({ context }) => ({ ...context, isLoading: true })),
      invoke: {
        src: "checkSession",
        input: () => ({}),
        onDone: {
          guard: 'isAuthenticated',
          target: 'authenticated',
          actions: 'setAuthenticated',
        },
        onError: {
          target: 'unauthenticated',
          actions: 'clearAuth',
        }
      },
    },
    authenticated: {
      entry: assign(({ context }) => ({ ...context, isLoading: false })),
      on: {
        LOGOUT: { actions: 'logout', target: 'checking' },
        SET_AUTHENTICATED: { actions: 'setAuthenticated' },
      }
    },
    unauthenticated: {
      entry: assign(({ context }) => ({ ...context, isLoading: false })),
      on: {
        SET_AUTHENTICATED: { target: 'authenticated', actions: 'setAuthenticated' },
      }
    },
  },
});

export default authMachine;