import { assign, fromPromise, setup } from "xstate";
import { registerWithEmailAndPassword } from "@/services/auth.service";

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
        registerWithEmailAndPassword: fromPromise(async ({ input: { username, email, password } }: { input: { username: string; email: string; password: string } }) => {
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
            return {
                ...context,
                error: errorMessage,
            };
        }),
        clearError: assign(({ context }) => ({ ...context, error: null })),
        clearForm: assign(() => ({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            error: null,
            authResponse: null,
        })),
        setValidationError: assign(({ context }) => {
            const username = context.username.trim();
            const email = context.email.trim();
            const password = context.password.trim();
            const confirmPassword = context.confirmPassword.trim();

            if (!username) {
                return { ...context, error: 'Username is required' };
            }

            if (!email) {
                return { ...context, error: 'Email is required' };
            }
            
            if (!password) {
                return { ...context, error: 'Password is required' };
            }
            
            if (password.length <= 6) {
                return { ...context, error: 'Password must be at least 7 characters long' };
            }
            
            if (!confirmPassword) {
                return { ...context, error: 'Please confirm your password' };
            }
            
            if (password !== confirmPassword) {
                return { ...context, error: 'Passwords do not match' };
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
            const username = context.username.trim();
            const email = context.email.trim();
            const password = context.password.trim();
            const confirmPassword = context.confirmPassword.trim();
            
            return username.length > 0
                && email.length > 0
                && password.length > 6
                && confirmPassword.length > 6
                && password === confirmPassword;
        },
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCcxQJawC5mQWQEMBjAC3QDswA6dCAGzAGIBhACQEEA5AcQFEB9AGIBJXgBkAIgG0ADAF1EoAA4B7WOizoV5RSAAeiAOwBGKgE4zANhlmAzGeOGArE+MAmABwAaEAE9Exg7mTrbG7gAsgWYeth4eAL7xPqgY2LiEpBTUtAyMAMoAqgBCeMIAKrIKSCCq6praugYInrbmhpYuhrbWlpbuPv4IoYZU3SaGHsYyk+HRiclomDj4xGSUNPRMhSXlUsZVymoaWjrVTZHmFlfXVx6WA4hmTqOGs5OGMl22bsYJSSApJbpVZZKiwACuACMALYaTTkKCMCDabLkABuKgA1tRAWkVpl1hCYXCKFAEBQMUQCPVyJVKrpascGmcjJ8qD8bKEfj8+sYHkMZM9wk5BcZehZDB8zPMAYs8Rk1tQibCsPDEbhkCpkFQlHRqQAzLXQqi45YK0HKkkI8nolRUml0+QMo40xqIWxdKjWOxmNwTGScty2fluINUCZmQUeQVPJzRwwy03AglK8FEIhwWCMPTYanUAj65YACimAYAlIwk-jFWC0xnYLB6dVGa6WQhDGHLN9DL7bMK43Z+ZMqLNbjJbE43JZQ25Ev9yCoIHBdFXzZRnXUTm6EABaSxUAOHo9H4zhfl7g-Hq8BhP-Vcg9Y5MAbpmnUBNSzhKgeNzjmdOaxxz5PxEDcOwqBCCJQm+LsXCcRM5TNB9U2JVVSRfVt30QScPAgz4f2FSxJnce4QIFVpoiedoRU8cIENSJCU1rdNMwwrc2zuNxzGFMDPksHtojPMjvlMSNpw8J5bFsGQ-XCSw53iIA */
    id: 'registerMachine',
    initial: 'idle',
    context: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        error: null,
        authResponse: null,
    },
    states: {
        idle: {
            on: {
                CHANGE_FIELD: { actions: 'changeField' },
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
            },
        },
        submitting: {
            invoke: {
                src: 'registerWithEmailAndPassword',
                input: ({ context }) => ({
                    username: context.username,
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

export default registerMachine;