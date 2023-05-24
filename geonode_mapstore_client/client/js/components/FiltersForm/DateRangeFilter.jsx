
/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { DateTimePicker } from 'react-widgets';
import { FormGroup } from 'react-bootstrap';
import moment from 'moment';
import momentLocalizer from 'react-widgets/lib/localizers/moment';

import Message from '@mapstore/framework/components/I18N/Message';

momentLocalizer(moment);

function DateRangeFilter({
    query,
    filterKey = 'dateFilter',
    labelId = 'gnviewer.date',
    format = 'YYYY-MM-DDT00:00:00',
    onChange
}) {

    const dateFromFilterKey = `filter{${filterKey}.gte}`;
    const dateToFilterKey = `filter{${filterKey}.lt}`;
    const dateFromValue = query[dateFromFilterKey] ? moment(query[dateFromFilterKey]).toDate() : undefined;
    const dateToValue = query[dateToFilterKey] ? moment(query[dateToFilterKey]).toDate() : undefined;

    function parseDate(value) {
        const date = moment(value);
        if (date.isValid()) {
            return date.format(format);
        }
        return null;
    }

    return (
        <>
            <FormGroup>
                <label><Message msgId={`${labelId}.from`}/></label>
                <DateTimePicker
                    value={dateFromValue}
                    max={dateToValue}
                    time={false}
                    onChange={(value) => {
                        onChange({
                            [dateFromFilterKey]: parseDate(value)
                        });
                    }}
                />
            </FormGroup>
            <FormGroup>
                <label><Message msgId={`${labelId}.to`}/></label>
                <DateTimePicker
                    value={dateToValue}
                    min={dateFromValue}
                    time={false}
                    onChange={(value) => {
                        onChange({
                            [dateToFilterKey]: parseDate(value)
                        });
                    }}
                />
            </FormGroup>
        </>
    );
}

DateRangeFilter.defaultProps = {};

export default DateRangeFilter;
