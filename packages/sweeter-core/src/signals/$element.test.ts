import { $element } from './$element.js';
import { $mutable } from './$mutable.js';

interface Example {
    prop: number;
}

it('$element mutations are visible on original object', () => {
    const signal = $mutable<Example[]>([{ prop: 1 }]);

    expect(signal.value).toStrictEqual([{ prop: 1 }]);

    const derived = $element(signal, 0);

    expect(derived.value).toStrictEqual({ prop: 1 });

    derived.value = { prop: 25 };

    expect(derived.value.prop).toStrictEqual(25);
    expect(signal.value).toStrictEqual([{ prop: 25 }]);
});
