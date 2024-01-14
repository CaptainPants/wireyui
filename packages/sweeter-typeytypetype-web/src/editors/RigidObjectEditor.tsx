import {
    $calc,
    $peek,
    $val,
    type ComponentInit,
} from '@captainpants/sweeter-core';
import { EditorSizesContext } from '../context/EditorSizesContext.js';
import {
    type ContextualValueCalculationContext,
    type Model,
    type ObjectModel,
    type PropertyModel,
    StandardLocalValues,
    asRigidObject,
    cast,
    categorizeProperties,
    type PropertyDefinition,
} from '@captainpants/typeytypetype';
import { AmbientValuesContext } from '../context/AmbientValuesContext.js';
import { DraftHook } from '../hooks/DraftHook.js';
import { type EditorProps } from '../types.js';
import { GlobalCssClass, stylesheet } from '@captainpants/sweeter-web';
import { PropertyEditorPart } from './PropertyEditorPart.js';
import { ImmutableLazyCache } from '../internal/ImmutableLazyCache.js';
import { Row, Column, Label } from '@captainpants/sweeter-gummybear';

export function RigidObjectEditor(
    {
        propertyDisplayName,
        model,
        replace,
        local,
        idPath,
        indent,
        isRoot,
    }: Readonly<EditorProps>,
    init: ComponentInit,
): JSX.Element {
    const typedModel = $calc(() => {
        return cast($val(model), asRigidObject);
    });

    const ambient = init.getContext(AmbientValuesContext);
    const { indentWidth } = init.getContext(EditorSizesContext);

    const { draft } = init.hook(
        DraftHook<
            ObjectModel<Record<string, unknown>>,
            ObjectModel<Record<string, unknown>>
        >,
        {
            model: typedModel,
            convertIn: (model) => model,
            convertOut: (draft) => {
                return {
                    success: true,
                    result: draft,
                };
            },
            onValid: async (validated) => {
                await $peek(replace)(validated);
            },
            validate: async (converted) => {
                const res = await typedModel
                    .peek()
                    .type.validate(converted.value);
                return res.success ? null : res.error;
            },
        },
    );

    const updatePropertyValue = async (
        propertyModel: PropertyModel<unknown>,
        value: Model<unknown>,
    ): Promise<void> => {
        const newDraft = await draft
            .peek()
            .setPropertyValue(propertyModel.name, value, true);

        console.log('updatePropertyValue');
        draft.update(newDraft);
    };

    const calculationContext: ContextualValueCalculationContext = {
        ambient,
        local,
    };

    const owner = $calc(() => draft.value.value);

    // Keep the PropertyEditorPart instances for each property that hasn't changed
    // we might even want to consider doing this based on property name, as then
    // we can just update based on the value of the property changing
    const getRenderer = new ImmutableLazyCache(
        (_key: PropertyDefinition<unknown>, name: string) => {
            // note that _key is the actual WeakMap key, but it doesn't hold the name of the property so it is passed through separately

            return (id: string) => (
                <PropertyEditorPart
                    id={id}
                    owner={owner}
                    propertyModel={$calc(
                        // NOTE: this depends on draft.value, so if that value changes it will get a new PropertyModel
                        // No other signals are referenced
                        () => draft.value.getPropertyModel(name)!,
                    )}
                    updateValue={updatePropertyValue}
                    indent={indent}
                    ownerIdPath={idPath}
                />
            );
        },
    );

    const categorizedProperties = $calc(() => {
        const properties = draft.value.getProperties().filter(
            (propertyModel) =>
                propertyModel.definition.getLocalValue(
                    StandardLocalValues.Visible,
                    typedModel.value,
                    calculationContext,
                ) !== true, // likely values are notFound and false
        );

        return categorizeProperties(properties, (propertyModel) => ({
            property: propertyModel,
            render: getRenderer.get(
                $val(propertyModel).definition,
                propertyModel.name,
            ),
        }));
    });

    const addIndent = !isRoot;

    const baseId = init.nextId();

    return $calc(() => {
        return (
            <div class={styles.editorOuter}>
                {propertyDisplayName && (
                    <div class={styles.editorPropertyDisplayName}>
                        {propertyDisplayName}
                    </div>
                )}
                <div class={styles.editorIndentContainer}>
                    {addIndent && (
                        <div
                            class={styles.editorIndent}
                            style={{ width: indentWidth }}
                        >
                            &gt;
                        </div>
                    )}
                    <div class={styles.editorContainer}>
                        {categorizedProperties.value.map(
                            ({ category, properties }, categoryIndex) => {
                                return (
                                    <div
                                        class={styles.category}
                                        key={`cat-${categoryIndex}`}
                                    >
                                        {categorizedProperties.value.length >
                                        0 ? (
                                            <Row>
                                                <Column xl="auto">
                                                    <Label
                                                        style={{
                                                            'font-weight':
                                                                'bold',
                                                        }}
                                                        class={
                                                            styles.categoryHeader
                                                        }
                                                        fillWidth
                                                    >
                                                        {category}
                                                    </Label>
                                                </Column>
                                            </Row>
                                        ) : undefined}
                                        {properties.map(
                                            ({ property, render }) => {
                                                const id =
                                                    baseId +
                                                    '_' +
                                                    property.name;

                                                return (
                                                    <Row
                                                        class={styles.property}
                                                        key={`prop-${property.name}`}
                                                    >
                                                        <Column xs={4}>
                                                            <Label for={id}>
                                                                {property
                                                                    .definition
                                                                    .displayName ??
                                                                    property.name}
                                                            </Label>
                                                        </Column>
                                                        <Column xs={8}>
                                                            {render(id)}
                                                        </Column>
                                                    </Row>
                                                );
                                            },
                                        )}
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>
            </div>
        );
    });
}

const styles = {
    editorOuter: new GlobalCssClass({
        className: 'editorOuter',
        content: stylesheet`
            display: flex;
            flex-direction: column;
            margin: 10px 0 10px 0;
        `,
    }),
    editorPropertyDisplayName: new GlobalCssClass({
        className: 'editorPropertyDisplayName',
        content: stylesheet`
            line-height: 2;
        `,
    }),
    editorIndentContainer: new GlobalCssClass({
        className: 'editorIndentContainer',
        content: stylesheet`
            display: flex;
            flex-direction: row;
        `,
    }),
    editorIndent: new GlobalCssClass({
        className: 'editorIndent',
        content: stylesheet`
            padding-top: 14;
            padding-left: 8;
            svg: {
                opacity: 0.25;
            }
        `,
    }),
    editorContainer: new GlobalCssClass({
        className: 'editorContainer',
        content: stylesheet`
            flex: 1;
        `,
    }),
    categoryHeader: new GlobalCssClass({
        className: 'categoryHeader',
        content: stylesheet` 
            font-weight: 'bold';
            line-height: 2;
        `,
    }),
    category: new GlobalCssClass({ className: 'category' }),
    property: new GlobalCssClass({ className: 'property' }),
};
