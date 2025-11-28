/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';

import Button from '@mapstore/framework/components/layout/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import FilterItems from '@mapstore/framework/plugins/ResourcesCatalog/components/FilterItems';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import { Checkbox } from 'react-bootstrap';

/**
 * FilterForm component allows to configure a list of field that can be used to apply filter on the page
 * @name FiltersForm
 * @memberof components
 * @prop {string} id the thumbnail is scaled based on the following configuration
 */
function FiltersForm({
    id,
    style,
    styleContainerForm,
    query,
    fields,
    onChange,
    onClear,
    extentProps,
    timeDebounce,
    filters,
    setFilters,
    handleSelectAll,
    selectAll,
    entries,
    selectedDocuments
}) {

    const handleFieldChange = (newParam) => {
        onChange(newParam);
    };

    const isAllSelected = entries?.length > 0 && selectedDocuments?.length === entries?.length;

    return (
        <div
            className="ms-filters-form"
            style={styleContainerForm}
        >
            <FlexBox
                component="form"
                column
                gap="sm"
                style={style}
            >
                <FilterItems
                    id={id}
                    items={fields}
                    values={query}
                    extentProps={{ ...extentProps, timeDebounce }}
                    onChange={handleFieldChange}
                    filters={filters}
                    setFilters={setFilters}
                    root
                />
            </FlexBox>
            <FlexBox style={{
                padding: '0.5rem  0rem'
            }} classNames={['ms-main-colors', '_corner-tl']} centerChildrenVertically gap="sm">
                <FlexBox.Fill>
                    <Checkbox
                        checked={isAllSelected}
                        onChange={(event) => handleSelectAll(event.target.checked)}
                        disabled={entries.length === 0}
                    >
                        <Message msgId={selectAll} />
                    </Checkbox>
                </FlexBox.Fill>
                <Button
                    size="sm"
                    variant="default"
                    onClick={onClear}
                    disabled={isEmpty(omit(query, ['page', 'page_size']))}
                >
                    <Message msgId="resourcesCatalog.clearFilters" />
                </Button>
            </FlexBox>
        </div>
    );
}

FiltersForm.propTypes = {
    id: PropTypes.string,
    style: PropTypes.object,
    styleContainerForm: PropTypes.object,
    query: PropTypes.object,
    fields: PropTypes.array,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onClear: PropTypes.func,
    extentProps: PropTypes.object,
    submitOnChangeField: PropTypes.bool,
    timeDebounce: PropTypes.number,
    formParams: PropTypes.object,
    selectAll: PropTypes.string,
    handleSelectAll: PropTypes.func,
    entries: PropTypes.array,
    selectedDocuments: PropTypes.array
};

FiltersForm.defaultProps = {
    query: {},
    fields: [],
    onChange: () => { },
    onClose: () => { },
    onClear: () => { },
    submitOnChangeField: true,
    timeDebounce: 500,
    formParams: {}
};

const arePropsEqual = (prevProps, nextProps) => {
    return isEqual(prevProps.query, nextProps.query)
        && isEqual(prevProps.fields, nextProps.fields)
        && isEqual(prevProps.filters, nextProps.filters)
        && prevProps.entries?.length === nextProps.entries?.length
        && prevProps.selectedDocuments?.length === nextProps.selectedDocuments?.length;
};


export default memo(FiltersForm, arePropsEqual);
