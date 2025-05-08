
/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mapstore/framework/components/layout/Button';
import { Glyphicon } from 'react-bootstrap';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import Message from '@mapstore/framework/components/I18N/Message';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';
import InputControl from '@mapstore/framework/plugins/ResourcesCatalog/components/InputControl';
import {
    canExpand,
    descriptionId,
    getTemplate,
    getUiOptions,
    titleId
} from '@rjsf/utils';

const scrollIntoView = (id) => {
    const node = document.querySelector(`[for=${id}]`) || document.getElementById(id);
    if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};

function MetadataGroupList({
    idSchema,
    title,
    group,
    expanded: expandedProp
}) {
    const [_expanded, setExpanded] = useState(false);
    const groupError = group.some(property => property.error);
    const expanded = expandedProp === undefined ? _expanded : expandedProp;
    return (
        <li>
            <Button className={groupError ? 'gn-metadata-error' : ''} size="xs" onClick={() => setExpanded((prevExpanded) => !prevExpanded)}>
                <Glyphicon glyph={expanded ? "bottom" : "next"} />{' '}{title}{groupError ? <>{' '}<Icon glyph="exclamation" /></> : null}
            </Button>
            {expanded ? <ul>
                {group
                    .map((property) => {
                        return (
                            <li key={property.name}>
                                <Button
                                    size="xs"
                                    className={property.error ? 'gn-metadata-error' : ''}
                                    onClick={() => scrollIntoView(idSchema[property.name]?.$id)}>
                                    {property.title}
                                    {property.error ? <>{' '}<Icon glyph="exclamation" /></> : null}
                                </Button>
                            </li>
                        );
                    })}
            </ul> : null}
        </li>
    );
}

function RootMetadata({
    idSchema,
    schema,
    uiSchema,
    properties,
    errorSchema,
    formContext
}, context) {
    const {
        title: metadataTitle
    } = formContext;
    const [filterText, setFilterText] = useState('');

    const groups = properties.reduce((acc, property) => {

        const title = schema?.properties?.[property.name]?.title || property.name;

        const _uiSchema = uiSchema?.[property?.name] || {};
        const options = _uiSchema?.['ui:options'] || {};
        if ((_uiSchema?.['ui:widget'] || options.widget) === 'hidden'
            || !title.toLowerCase().includes((filterText || '').toLowerCase())) {
            return acc;
        }
        const sectionKey = options?.['geonode-ui:group'] || getMessageById(context.messages, 'gnviewer.metadataGroupTitle');
        const sectionItems = acc[sectionKey] || [];
        return {
            ...acc,
            [sectionKey]: [...sectionItems, { ...property, uiSchema: _uiSchema, schema: schema?.properties?.[property.name], error: errorSchema[property.name], title }]
        };
    }, {});

    const metadataTitleId = 'gn-metadata-title';
    const emptyMetadata = !Object.keys(groups).some(groupKey => groups[groupKey].length > 0);

    return (
        <div className="gn-metadata-layout">
            <ul className="gn-metadata-list">
                <InputControl
                    placeholder="gnviewer.filterMetadata"
                    value={filterText}
                    onChange={(value) => setFilterText(value)}
                />
                {metadataTitle ? <li><Button size="xs" onClick={() => scrollIntoView(metadataTitleId)}><Message msgId="gnviewer.metadataFor" /> {metadataTitle}</Button></li> : null}
                {Object.keys(groups)
                    .filter(groupKey => groups[groupKey].length > 0)
                    .map((groupKey) => {
                        const group = groups[groupKey];
                        return (
                            <MetadataGroupList
                                key={groupKey}
                                idSchema={idSchema}
                                title={groupKey}
                                group={group}
                                expanded={filterText ? true : undefined}
                            />
                        );
                    })}
            </ul>
            <div className="gn-metadata-groups">
                {metadataTitle ? <div id={metadataTitleId} className="gn-metadata-title">
                    <Message msgId="gnviewer.metadataFor" /> {metadataTitle}
                </div> : null}
                {emptyMetadata ? <div className="field"><Message msgId="gnviewer.noMetadataFound" /></div> : null}
                {Object.keys(groups)
                    .filter(groupKey => groups[groupKey].length > 0)
                    .map((groupKey, idx) => {
                        const group = groups[groupKey];
                        return (
                            <div className="gn-metadata-group" key={idx}>
                                <div className="gn-metadata-group-title">{groupKey}</div>
                                {group.map((property, jdx) => {
                                    return <React.Fragment key={`${idx}_${jdx}`}>{property.content}</React.Fragment>;
                                })}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

RootMetadata.contextTypes = {
    messages: PropTypes.object
};

function ObjectFieldTemplate(props) {
    const isRoot = props?.idSchema?.$id === 'root';
    if (isRoot) {
        return <RootMetadata {...props} />;
    }
    const {
        description,
        disabled,
        formData,
        idSchema,
        onAddClick,
        properties,
        readonly,
        registry,
        required,
        schema,
        title,
        uiSchema
    } = props;
    const options = getUiOptions(uiSchema);
    const TitleFieldTemplate = getTemplate('TitleFieldTemplate', registry, options);
    const DescriptionFieldTemplate = getTemplate(
        'DescriptionFieldTemplate',
        registry,
        options
    );
    const {
        ButtonTemplates: { AddButton }
    } = registry.templates;
    return (
        <div id={idSchema.$id}>
            {title && (
                <TitleFieldTemplate
                    id={titleId(idSchema)}
                    title={title}
                    required={required}
                    schema={schema}
                    uiSchema={uiSchema}
                    registry={registry}
                    description={<DescriptionFieldTemplate
                        id={descriptionId(idSchema)}
                        description={description}
                        schema={schema}
                        uiSchema={uiSchema}
                        registry={registry}
                    />}
                />
            )}
            {properties?.length ? <div className="field-object-properties">
                {properties.map((prop) => prop.content)}
            </div> : null}
            {canExpand(schema, uiSchema, formData) && (
                <AddButton
                    onClick={onAddClick(schema)}
                    disabled={disabled || readonly}
                    uiSchema={uiSchema}
                    registry={registry}
                />
            )}
        </div>
    );
}

export default ObjectFieldTemplate;
