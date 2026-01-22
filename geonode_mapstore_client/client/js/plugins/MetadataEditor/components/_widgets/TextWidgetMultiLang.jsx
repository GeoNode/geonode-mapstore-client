/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from "react";
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

import DefaultTextareaWidget from '@rjsf/core/lib/components/widgets/TextareaWidget';
import IconWithTooltip from '../IconWithTooltip';
import { getMessageById, getSupportedLocales } from '@mapstore/framework/utils/LocaleUtils';

const TextWidgetMultiLang = (props) => {

    const { formData, onChange, schema, required, formContext } = props;

    const id = props.idSchema?.$id;
    const { title, description } = schema;

    const languages = Object.keys(schema?.properties);
    const languageLabels = languages.reduce((acc, lang) => {
        const label = schema?.properties?.[lang]?.['geonode:multilang-lang-label'];
        acc[lang] = label;
        return acc;
    }, {});

    const getLanguageName = (langCode) => {
        const languagesNames = getSupportedLocales();
        const langName = languageLabels[langCode] || languagesNames[langCode]?.description;
        return `${langName} (${langCode})`;
    };

    const isTextarea = schema?.['ui:options']?.widget === 'textarea';

    const [currentLang, setCurrentLang] = useState(languages[0]);
    const values = formData || {};

    const handleInputChange = (ev) => {
        const value = isString(ev) ? ev : ev?.target?.value;
        const newValue = {
            ...values,
            [currentLang]: value
        };

        onChange(newValue);
    };

    const placeholder = getMessageById(formContext.messages, "gnviewer.typeText").replace("{lang}", getLanguageName(currentLang));

    return (
        <div className="form-group field field-string multilang-widget">
            <label className={`control-label${formContext?.capitalizeTitle ? ' capitalize' : ''}`}>
                {title}
                {required && <span className="required">{' '}*</span>}
                {!isEmpty(description) ? <>{' '}
                    <IconWithTooltip tooltip={description} tooltipPosition={"right"} />
                </> : null}
            </label>
            {isTextarea ? (
                <DefaultTextareaWidget
                    id={id}
                    value={values[currentLang] || ""}
                    onChange={handleInputChange}
                    onFocus={() => {}}
                    onBlur={() => {}}
                    options={{ rows: 5 }}
                    placeholder={placeholder}
                />
            ) :
                <input
                    id={id}
                    type="text"
                    className="form-control"
                    value={values[currentLang] || ""}
                    onChange={handleInputChange}
                    onBlur={() => {}}
                    placeholder={placeholder}
                />
            }

            <div className="multilang-widget-buttons">
                {languages.map((lang) => (
                    <button
                        key={lang}
                        type="button"
                        className={`btn btn-xs ${currentLang === lang ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setCurrentLang(lang)}
                    >
                        {getLanguageName(lang)}
                    </button>
                ))}
            </div>
        </div>
    );
};


export default TextWidgetMultiLang;
