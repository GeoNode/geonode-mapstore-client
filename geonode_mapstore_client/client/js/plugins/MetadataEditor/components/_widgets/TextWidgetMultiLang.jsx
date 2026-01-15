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

const TextWidgetMultiLang = (props) => {

  const { formData, onChange, schema, required, formContext, registry } = props;
  const id = props.id || Math.random().toString(36).substring(7);
  const { title, description } = schema;

  // TODO map langs from schema when iso lang is change to 2 chars https://github.com/GeoNode/geonode/issues/13643#issuecomment-3728578749
  const languages = ["en", "hy", "ru"];
  const languageLong = (langCode) => {
    return {
      en: "English",
      hy: "Armenian",
      ru: "Russian"
    }[langCode] || langCode.toUpperCase();
  }

  const isTextarea = schema?.['ui:options']?.widget === 'textarea';

  const [currentLang, setCurrentLang] = useState(languages[0]);
  const values = formData || {};

  const handleInputChange = (ev) => {
    const value = isString(ev) ? ev : ev?.target?.value;
    const newValue = {
      ...values,
      [currentLang]: value,
    };
    onChange(newValue);
  };

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
          options={{ rows: 5 }}
          placeholder={`Type textarea in ${languageLong(currentLang)}...`}
        />
      ) : 
      <input
        type="text"
        className="form-control"
        value={values[currentLang] || ""}
        onChange={handleInputChange}
        placeholder={`Type text in ${languageLong(currentLang)}...`}
      />
      }
      
      <div style={{ marginTop: "8px", display: "flex", gap: "5px" }}>
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
