import { assign, fromPromise, setup } from "xstate";
import { registerWithEmailAndPassword } from "@/services/auth.service";

const initialContext = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    error: null,
    authResponse: null,
}

const registerMachine = setup({
  types: {
    context: {} as {
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
      error: string | null;
      authResponse: { accessToken: string } | null;
    },
    events: {} as
      | { type: 'CHANGE_FIELD'; field: 'username' | 'email' | 'password' | 'confirmPassword'; value: string }
      | { type: 'SUBMIT' }
      | { type: 'RESET' }
  },
  actors: {
    registerWithEmailAndPassword: fromPromise(async ({ input: { username, email, password, confirmPassword } }: { input: { username: string; email: string; password: string; confirmPassword: string } }) => {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      const response = await registerWithEmailAndPassword(username, email, password);
      return response;
    }),
  },
  actions: {
    changeField: assign(({ context, event }) => {
      if (event.type !== 'CHANGE_FIELD') return context;
      return {
        ...context,
        [event.field]: event.value,
        error: null, // Clear error when user starts typing
      };
    }),
    setError: assign(({ context, event }) => {
      const error = (event as unknown as { error: Error | unknown }).error;
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      return { ...context, error: errorMessage };
    }),
    clearError: assign(({ context }) => ({ ...context, error: null })),
    clearForm: assign(() => initialContext),
    storeAuth: assign(({ context, event }) => {
      const output = (event as unknown as { output: { accessToken: string } }).output;
      return { ...context, authResponse: output };
    }),
  },
}).createMachine({
  id: 'registerMachine',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        CHANGE_FIELD: { actions: 'changeField' },
        SUBMIT: { target: 'submitting', actions: 'clearError' },
      },
    },
    submitting: {
      invoke: {
        src: 'registerWithEmailAndPassword',
        input: ({ context }) => ({
          username: context.username,
          email: context.email,
          password: context.password,
          confirmPassword: context.confirmPassword,
        }),
        onDone: { target: 'success', actions: 'storeAuth' },
        onError: { target: 'idle', actions: 'setError' },
      },
    },
    success: {
      after: {
        1000: { target: 'idle', actions: 'clearForm' },
      },
    },
  },
});

export default registerMachine;
