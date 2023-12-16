import type { AbstractGlobalCssStylesheet } from './index.js';

export class StylesheetDependencyProvider {
    #callbacks: ((dependency: AbstractGlobalCssStylesheet) => void)[] = [];
    #frozen?: boolean;

    addDependency(dependency: AbstractGlobalCssStylesheet): void {
        if (this.#frozen) {
            return;
        }

        for (const callback of this.#callbacks) {
            try {
                callback(dependency);
            } catch (ex) {
                console.error('Swallowed error', ex);
            }
        }
    }

    addDependencyListener(
        callback: (dependency: AbstractGlobalCssStylesheet) => void,
    ): void {
        if (this.#frozen) {
            return;
        }

        this.#callbacks.push(callback);
    }

    freeze(): void {
        this.#frozen = true;
    }
}
