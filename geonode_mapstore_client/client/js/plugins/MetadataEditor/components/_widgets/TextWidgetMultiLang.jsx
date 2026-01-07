/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

import DefaultTextWidget from "@rjsf/core/lib/components/widgets/TextWidget";
import DefaultTextareaWidget from '@rjsf/core/lib/components/widgets/TextareaWidget';
import FieldTemplate from "../_templates/FieldTemplate";
import IconWithTooltip from '../IconWithTooltip';
import {
    getTemplate,
    getUiOptions
} from '@rjsf/utils';

const TextWidgetMultiLang = (props) => {

  //console.log("TextWidgetMultiLang props:", props);

  const { formData, onChange, schema, required, formContext, registry } = props;
  const id = props.id || Math.random().toString(36).substring(7);
  const { title, description } = schema;

  //TODO map langs from schema when iso lang is change to 2 chars https://github.com/GeoNode/geonode/issues/13643#issuecomment-3728578749
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
    console.log("handleInputChange value:", value, newValue);
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


/**
 * schema definition for multilang fields: 
 * https://github.com/GeoNode/geonode/issues/13643
 * 
 * loaded from backend as: http://localhost/api/v2/metadata/schema?format=json
 * 
 * 
 * "title": {
      "type": "string",
      "title": "Title",
      "description": "name by which the cited resource is known",
      "maxLength": 255,
      "geonode:handler": "base",
      "geonode:required": true,
      "geonode:multilang": true,
      "readOnly": true,
      "ui:widget": "hidden"
  },
  "title_multilang_en": {
      "type": [
          "string",
          "null"
      ],
      "geonode:handler": "sparse",
      "geonode:multilang-lang": "en",
      "geonode:multilang-group": "title",
      "title": "Title [EN] !",
      "geonode:required": true,
      "description": "name by which the cited resource is known"
  },
  "title_multilang_hy": {
      "type": [
          "string",
          "null"
      ],
      "geonode:handler": "sparse",
      "geonode:multilang-lang": "hy",
      "geonode:multilang-group": "title",
      "title": "Title [HY]"
  },
  "title_multilang_ru": {
      "type": [
          "string",
          "null"
      ],
      "geonode:handler": "sparse",
      "geonode:multilang-lang": "ru",
      "geonode:multilang-group": "title",
      "title": "Title [RU]"
  },

  textarea widgets

  "abstract": {
      "type": "string",
      "title": "Abstract",
      "description": "brief narrative summary of the content of the resource(s)",
      "maxLength": 2000,
      "ui:options": {
        "widget": "hidden",
        "rows": 5
      },
      "geonode:handler": "base",
      "geonode:required": true,
      "geonode:multilang": true,
      "readOnly": true
    },
    "abstract_multilang_en": {
      "type": [
        "string",
        "null"
      ],
      "geonode:handler": "sparse",
      "geonode:multilang-lang": "en",
      "geonode:multilang-group": "abstract",
      "title": "Abstract [EN] !",
      "geonode:required": true,
      "description": "brief narrative summary of the content of the resource(s)",
      "ui:options": {
        "widget": "textarea",
        "rows": 5
      }
    }
 * 
 * 
 */

// // schema of form
// const schema = {
//   title: "Esempio Form Multilingua",
//   type: "object",
//   properties: {
//     titolo_prodotto: {
//       type: "object",
//       title: "Nome Prodotto (Multilingua)",
//       properties: {
//         it: { type: "string" },
//         en: { type: "string" },
//         fr: { type: "string" },
//       },
//     },
//   },
// };

// // uiSchema of rjsf form
// const uiSchema = {
//   titolo_prodotto: {
//     "ui:widget": "MultiLangWidget",
//     "ui:options": {
//       languages: ["it", "en", "es"], // Personalizzabile qui
//     },
//   },
// };

// USAGE EXAMPLE:
// register widget on Form
// const widgets = {
//   MultiLangWidget: MultiLangWidget
// };
// export const TextWidgetMultiLang = () => (
//   <Form
//     schema={schema}
//     uiSchema={uiSchema}
//     widgets={widgets}
//     validator={validator}
//     onChange={(e) => console.log("Data:", e.formData)}
//   />
// );
