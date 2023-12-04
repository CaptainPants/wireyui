import { preprocessClassContent } from './preprocessor/preprocess.js';
import type {
    GlobalStyleSheetContentGeneratorContext,
    AbstractGlobalCssStylesheet,
} from './types.js';

type Content = ((className: string) => string) | string | undefined;

export interface GlobalCssClassOptions {
    /**
     * Base the class name for this class on this value (it will be prefixed/suffixed or otherwise made unique).
     */
    className: string;
    content?: Content;
    preprocess?: boolean;
}

export class GlobalCssClass implements AbstractGlobalCssStylesheet {
    public readonly className: string;
    public readonly id: string;
    public readonly symbol: symbol;
    public readonly content?: Content;
    public readonly preprocess: boolean;

    constructor(options: GlobalCssClassOptions);
    constructor({
        className,
        content,
        preprocess = true,
    }: GlobalCssClassOptions) {
        this.className = className;
        this.id = className;
        this.symbol = Symbol('GlobalCssClass-' + className);
        this.content = content;
        this.preprocess = preprocess;
    }

    getContent(
        context: GlobalStyleSheetContentGeneratorContext,
    ): string | undefined {
        const name = context.getPrefixedClassName(this);

        const content =
            typeof this.content === 'string'
                ? this.content
                : this.content?.('.' + name);

        if (!content) {
            return undefined;
        }

        const transformed = this.preprocess
            ? preprocessClassContent(name, content)
            : `.${name}\r\n{\r\n${content}\r\n}`;
        return transformed;
    }
}
