/* eslint-disable @typescript-eslint/no-unused-vars */

import { z } from 'zod';
import { type TypeMatchAssert } from '../testingTypes.js';

import { type NumberConstantModel, type StringModel } from './Model.js';
import { ModelFactory } from './ModelFactory.js';

test('union', async () => {
    const nested = z.union([z.literal(1), z.literal(2)]);

    const unionType = z.union([nested, z.string()]);

    const typeTest1: TypeMatchAssert<
        typeof unionType,
        z.ZodUnion<
            [z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>]>, z.ZodString]
        >
    > = true;

    const model = await ModelFactory.createModel({ value: 1, arkType: unionType });

    const value1: 1 | 2 | string = model.value;

    expect(value1).toStrictEqual(1);

    const resolved = model.getDirectlyResolved();

    expect(resolved.type).toStrictEqual(nested);
    expect(resolved.value).toStrictEqual(1);
});
