import { GlobalCss } from './GlobalCss.js';
import { GlobalCssClass } from './GlobalCssClass.js';

export const styles = {
    class: function (id: string, content: string) {
        return new GlobalCssClass({ id, content });
    },
    global: function (id: string, content: string) {
        return new GlobalCss({ id, content });
    },
};
