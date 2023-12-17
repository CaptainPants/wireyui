import { StylesheetFragmentBuilder } from './StylesheetFragmentBuilder.js';
import { stylesheet } from './stylesheet.js';

it('Circular dependency works', () => {
    const builder = new StylesheetFragmentBuilder();

    builder
        .appendLine('a')
        .appendLine('b')
        .appendLine(stylesheet`c`);

    const built = builder.build();

    const asString = built({
        getPrefixedClassName: (thing) => thing.className,
    });

    expect(asString).toMatchSnapshot();
});
