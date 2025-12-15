import { assign, fromPromise, setup } from "xstate";
import { loginWithEmailAndPassword, signInWithGoogle, signInWithGithub, signInWithFacebook } from "@/services/auth.service";

const loginMachine = setup({
  types: {
    context: {} as {
      email: string;
      password: string;
      showPassword: boolean;
      error: string | null;
      authResponse: { accessToken: string } | null;
    },
    events: {} as
      | { type: 'CHANGE_FIELD'; field: 'email' | 'password'; value: string }
      | { type: 'TOGGLE_PASSWORD_VISIBILITY' }
      | { type: 'SUBMIT' }
      | { type: 'SIGN_IN_WITH_GOOGLE' }
      | { type: 'SIGN_IN_WITH_GITHUB' }
      | { type: 'SIGN_IN_WITH_FACEBOOK' }
      | { type: 'RESET' },
  },
  actors: {
    login: fromPromise(async ({ input: { email, password } }: { input: { email: string; password: string } }) => {
      const response = await loginWithEmailAndPassword(email, password);
      return response;
    }),
    signInWithGoogle: fromPromise(async () => {
      const response = await signInWithGoogle();
      return response;
    }),
    signInWithGithub: fromPromise(async () => {
      const response = await signInWithGithub();
      return response;
    }),
    signInWithFacebook: fromPromise(async () => {
      const response = await signInWithFacebook();
      return response;
    }),
  },
  actions: {
    togglePasswordVisibility: assign(({ context }) => ({ ...context, showPassword: !context.showPassword })),
    changeField: assign(({ context, event }) => {
        if (event.type !== 'CHANGE_FIELD') return context;
        
        return { ...context, [event.field]: event.value };
    }),
    setError: assign(({ context, event }) => {
      const error = (event as unknown as { error: Error | unknown }).error;
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      return { ...context, error: errorMessage };
    }),
      clearError: assign(({ context }) => ({ ...context, error: null })),
      clearForm: assign(() => ({
          email: '',
          password: '',
          error: null,
          authResponse: null,
      })),
      setValidationError: assign(({ context }) => {
        const email = context.email.trim();
        const password: string = context.password.trim();

        if (!email) {
          return { ...context, error: 'Email is required' };
        }

        if (password.length <= 6) {
          return { ...context, error: 'Password is required and must be at least 7 characters long.' };
        }

        return context;
      }),
      storeAuth: assign(({ context, event }) => {
        const output = (event as unknown as { output: { accessToken: string } }).output;
        return { ...context, authResponse: output };
      }),
  },
  guards: {
    isValidForm: ({ context }) => {
      const email = context.email.trim();
      const password = context.password.trim();
      return email.length > 0 && password.length > 6;
    },
  },
}).createMachine({
  id: 'loginMachine',
  initial: 'idle',
  context: {
    email: 'sameershamshad.42@gmail.com',
    password: '12345678',
    showPassword: false,
    error: null,
    authResponse: null,
  },
  states: {
    idle: {
        on: {
          TOGGLE_PASSWORD_VISIBILITY: { actions: 'togglePasswordVisibility' },
          CHANGE_FIELD: { 
            actions: ['changeField', 'clearError'],
          },
          SUBMIT: [
            {
              guard: 'isValidForm',
              target: 'submitting',
              actions: 'clearError',
            },
            {
              actions: 'setValidationError',
              target: 'idle',
            },
          ],
          SIGN_IN_WITH_GOOGLE: {
            target: 'signingInWithGoogle',
            actions: 'clearError',
          },
          SIGN_IN_WITH_GITHUB: {
            target: 'signingInWithGithub',
            actions: 'clearError',
          },
          SIGN_IN_WITH_FACEBOOK: {
            target: 'signingInWithFacebook',
            actions: 'clearError',
          },
        },
    },
    signingInWithGoogle: {
      invoke: {
        src: 'signInWithGoogle',
        input: () => ({}),
        onDone: {
          target: 'success',
          actions: 'storeAuth',
        },
        onError: {
          target: 'idle',
          actions: 'setError',
        },
      },
    },
    signingInWithGithub: {
      invoke: {
        src: 'signInWithGithub',
        input: () => ({}),
        onDone: {
          target: 'success',
          actions: 'storeAuth',
        },
        onError: {
          target: 'idle',
          actions: 'setError',
        },
      },
    },
    signingInWithFacebook: {
      invoke: {
        src: 'signInWithFacebook',
        input: () => ({}),
        onDone: {
          target: 'success',
          actions: 'storeAuth',
        },
        onError: {
          target: 'idle',
          actions: 'setError',
        },
      },
    },
    submitting: {
      invoke: {
        src: 'login',
        input: ({ context }) => ({
          email: context.email,
          password: context.password,
        }),
        onDone: {
          target: 'success',
          actions: 'storeAuth',
        },
        onError: {
          target: 'idle',
          actions: 'setError',
        },
      },
    },
    success: {
      after: {
        1000: { target: 'idle', actions: 'clearForm' },
      },
    },
  },
});

export default loginMachine;