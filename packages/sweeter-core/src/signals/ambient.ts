import { type Signal } from './types.js';

export type AmbientSignalUsageListener = (signal: Signal<unknown>) => void;

let _ambientUsageListener: AmbientSignalUsageListener | undefined;
let _ambientChangesBlocked: boolean = false;

export function announceSignalUsage(signal: Signal<unknown>): void {
    _ambientUsageListener?.(signal);
}

/**
 * Disables tracking of signals that are referenced in the callback.
 * @param callback
 * @returns
 */
export function untrack<T>(callback: () => T): T {
    return callAndInvokeListenerForEachDependency(callback, () => {}, false);
}

export function trackingIsAnError<T>(callback: () => T): T {
    return callAndInvokeListenerForEachDependency(
        callback,
        (signal) => {
            throw new Error(
                `Tracking is blocked here, meaning you have probably inadvertantly used .value when you should use .peek().`,
            );
        },
        false,
    );
}

export function announceMutatingSignal(signal: Signal<unknown>) {
    if (_ambientChangesBlocked) {
        throw new TypeError(
            'Mutating a signal inside a DerivedSignal is not allowed.',
        );
    }
}

export type CallAndReturnDependenciesResult<T> =
    | {
          succeeded: true;
          result: T;
          dependencies: Set<Signal<unknown>>;
      }
    | {
          succeeded: false;
          error: unknown;
          dependencies: Set<Signal<unknown>>;
      };

export function callAndReturnDependencies<T, TArgs extends readonly unknown[]>(
    callback: (...args: TArgs) => T,
    readonly: boolean,
    ...args: TArgs
): CallAndReturnDependenciesResult<T> {
    const dependencies = new Set<Signal<unknown>>();

    const listener = (signal: Signal<unknown>) => {
        dependencies.add(signal);
    };

    try {
        const result = callAndInvokeListenerForEachDependency(
            callback,
            listener,
            readonly,
            ...args,
        );

        return {
            succeeded: true,
            result: result,
            dependencies: dependencies,
        };
    } catch (err) {
        return {
            succeeded: false,
            error: err,
            dependencies,
        };
    }
}

export function callAndInvokeListenerForEachDependency<
    T,
    TArgs extends readonly unknown[],
>(
    callback: (...args: TArgs) => T,
    listener: AmbientSignalUsageListener,
    readonly: boolean,
    ...args: TArgs
): T {
    // Save
    const saved_ambientUsageListener = _ambientUsageListener;
    const saved_ambientChangesBlocked = _ambientChangesBlocked;

    // Replace
    _ambientUsageListener = listener;
    _ambientChangesBlocked = readonly;

    try {
        return callback(...args);
    } finally {
        // Restore
        _ambientUsageListener = saved_ambientUsageListener;
        _ambientChangesBlocked = saved_ambientChangesBlocked;
    }
}
