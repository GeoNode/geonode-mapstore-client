/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import PropTypes from 'prop-types';

import SelectInfiniteScroll from '@js/components/SelectInfiniteScroll/SelectInfiniteScroll';
import IconWithTooltip from './IconWithTooltip';

const Autocomplete = ({
    className,
    description,
    error,
    helpTitleIcon,
    id,
    labelKey = "label",
    name,
    title,
    value,
    valueKey = "value",
    showLabel = true,
    required,
    ...props
}) => {
    const getValue = () => {
        if (value) {
            return isArray(value) ? value.map((entry) => {
                return {
                    result: entry,
                    [valueKey]: isString(entry) ? entry : entry[valueKey],
                    [labelKey]: isString(entry) ? entry : entry[labelKey]
                };
            }) : {
                [valueKey]: isString(value) ? value : value[valueKey],
                [labelKey]: isString(value) ? value : value[labelKey]
            };
        }
        return value;
    };

    return (
        <div className={`form-group${className ? " " + className : ""}${!!error ? " " + "has-error" : ""}`}>
            {showLabel ? <label className="control-label" htmlFor={id}>
                {title || name}
                {required ? <span className="required">{' '}*</span> : null}
                {helpTitleIcon && !isEmpty(description) ? <>{' '}
                    <IconWithTooltip tooltip={description} tooltipPosition={"right"} />
                </> : null}
            </label> : null}
            <SelectInfiniteScroll
                {...props}
                id={id}
                value={getValue()}
                valueKey={valueKey}
                labelKey={labelKey}
            />
            {error}
        </div>
    );
};

Autocomplete.propTypes = {
    className: PropTypes.string,
    description: PropTypes.string,
    error: PropTypes.element,
    helpTitleIcon: PropTypes.bool,
    id: PropTypes.string.isRequired,
    labelKey: PropTypes.string,
    name: PropTypes.string,
    title: PropTypes.string,
    value: PropTypes.any.isRequired,
    valueKey: PropTypes.string,
    showLabel: PropTypes.bool
};

export default Autocomplete;
