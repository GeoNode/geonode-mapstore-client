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
import Message from '@mapstore/framework/components/I18N/Message';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';

const TextWidgetMultiLang = (props) => {

    const { formData, onChange, schema, required, formContext } = props;
    console.log('TextWidgetMultiLang props', props);

    const id = props.id || Math.random().toString(36).substring(7);
    const { title, description } = schema;

    const languages = Object.keys(schema?.properties);
    const languageLabels = languages.reduce((acc, lang) => {
        const label = schema?.properties?.[lang]?.['geonode:multilang-lang-label'] || lang;
        acc[lang] = label;
        return acc;
    }, {});

    const languageLong = (langCode) => {
        return languageLabels[langCode] || langCode;
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

    const placeholder = getMessageById(formContext.messages, "gnviewer.typeText").replace("{lang}", languageLong(currentLang));

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
                        {languageLong(lang)}
                    </button>
                ))}
            </div>
        </div>
    );
};


export default TextWidgetMultiLang;
