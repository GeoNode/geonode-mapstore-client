/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

import Button from '@js/components/Button';
import Tabs from '@js/components/Tabs';
import DetailsAttributeTable from '@js/components/DetailsPanel/DetailsAttributeTable';
import DetailsLinkedResources from '@js/components/DetailsPanel/DetailsLinkedResources';
import Message from '@mapstore/framework/components/I18N/Message';
import DetailsLocations from '@js/components/DetailsPanel/DetailsLocations';
import DetailsAssets from '@js/components/DetailsPanel/DetailsAssets';

const replaceTemplateString = (properties, str) => {
    return Object.keys(properties).reduce((updatedStr, key) => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        return updatedStr.replace(regex, properties[key]);
    }, str);
};

const getDateRangeValue = (startValue, endValue, format) => {
    if (startValue && endValue) {
        return `${moment(startValue).format(format)} - ${moment(endValue).format(format)}`;
    }
    return moment(startValue ? startValue : endValue).format(format);
};
const isEmptyValue = (value) => {
    if (Array.isArray(value)) {
        return isEmpty(value);
    }
    if (typeof value === 'object') {
        return isEmpty(value) || (isEmpty(value.start) && isEmpty(value.end));
    }
    return value === 'None' || !value;
};
const isStyleLabel = (style) => style === "label";
const isFieldLabelOnly = ({style, value}) => isEmptyValue(value) && isStyleLabel(style);

const DetailInfoFieldLabel = ({ field }) => {
    const label = field.labelId ? <Message msgId={field.labelId} /> : field.label;
    return isStyleLabel(field.style) && field.href
        ? (<a href={field.href} target={field.target}>{label}</a>)
        : label;
};

function DetailsInfoField({ field, children }) {
    const values = castArray(field.value);
    const isLinkLabel = isFieldLabelOnly(field);
    return (
        <div className={`gn-details-info-row${isLinkLabel ? ' link' : ''}`}>
            <div className={`gn-details-info-label`}><DetailInfoFieldLabel field={field} /></div>
            {!isLinkLabel && <div className="gn-details-info-value">{children(values)}</div>}
        </div>
    );
}

function DetailsHTML({ value, placeholder }) {
    const [expand, setExpand] = useState(false);
    if (placeholder) {
        return (
            <div className={`gn-details-info-html${expand ? '' : ' collapsed'}`}>
                {expand
                    ? <div className="gn-details-info-html-value" dangerouslySetInnerHTML={{ __html: value }} />
                    : <div className="gn-details-info-html-value">{placeholder}</div>}
                <Button onClick={() => setExpand(!expand)}>
                    <Message msgId={expand ? 'gnviewer.readLess' : 'gnviewer.readMore'} />
                </Button>
            </div>);
    }
    return (
        <div dangerouslySetInnerHTML={{ __html: value }} />
    );
}

function DetailsInfoFields({ fields, formatHref }) {
    return (<div className="gn-details-info-fields">
        {fields.map((field, filedIndex) => {
            if (field.type === 'link') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => {
                            return field.href
                                ? <a key={idx} href={field.href}>{value}</a>
                                : <a key={idx} href={value.href}>{value.value}</a>;
                        })}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'query') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <a key={idx} href={formatHref({
                                query: field.queryTemplate
                                    ? Object.keys(field.queryTemplate)
                                        .reduce((acc, key) => ({
                                            ...acc,
                                            [key]: replaceTemplateString(value, field.queryTemplate[key])
                                        }), {})
                                    : field.query,
                                pathname: field.pathname
                            })}>{field.valueKey ? value[field.valueKey] : value}</a>
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'date') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <span key={idx}>{(value?.start || value?.end) ? getDateRangeValue(value.start, value.end, field.format || 'MMMM Do YYYY') : moment(value).format(field.format || 'MMMM Do YYYY')}</span>
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'html') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <DetailsHTML key={idx} value={value} placeholder={field.placeholder} />
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'text') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <span key={idx}>{value}</span>
                        ))}
                    </DetailsInfoField>
                );
            }
            return null;
        })}
    </div>);
}

const tabTypes = {
    'attribute-table': DetailsAttributeTable,
    'linked-resources': DetailsLinkedResources,
    'locations': DetailsLocations,
    'tab': DetailsInfoFields,
    'assets': DetailsAssets
};

const parseTabItems = (items) => {
    return (items || []).filter(({value, style}) => {
        return !(isEmptyValue(value) && !isStyleLabel(style));
    });
};
const isDefaultTabType = (type) => type === 'tab';

function DetailsInfo({
    tabs = [],
    ...props
}) {
    const filteredTabs = tabs
        .filter((tab) => !tab?.disableIf)
        .map((tab) =>
            ({
                ...tab,
                items: isDefaultTabType(tab.type) ? parseTabItems(tab?.items) : tab?.items,
                Component: tabTypes[tab.type] || tabTypes.tab
            }))
        .filter(tab => !isEmpty(tab?.items));
    const [selectedTabId, onSelect] = useState(filteredTabs?.[0]?.id);
    return (
        <Tabs
            className="gn-details-info tabs-underline"
            selectedTabId={selectedTabId}
            onSelect={onSelect}
            tabs={filteredTabs.map(({Component, ...tab} = {}) => ({
                title: <DetailInfoFieldLabel field={tab} />,
                eventKey: tab?.id,
                component: <Component fields={tab?.items} {...props} />
            }))}
        />
    );
}

export default DetailsInfo;
