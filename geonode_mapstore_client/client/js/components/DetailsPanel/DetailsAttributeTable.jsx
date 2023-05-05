/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import Table from '@js/components/Table';


const parseAttributeData = (fields) => {
    if (fields) {
        const header = [{
            value: "Name",
            key: "name"
        }, {
            value: "Label",
            key: "label"
        }, {
            value: "Description",
            key: "description"
        }];
        const na = <FormattedMessage id="gnhome.na" defaultMessage="N/A" />;
        const rows = fields.map(attribute => ({
            name: attribute.attribute,
            label: attribute.attribute_label || na,
            description: attribute.description || na
        }));

        return { header, rows };
    }

    return { header: [], rows: [] };
};


const DetailsAttributeTable = ({ fields }) => {
    const attributeData = parseAttributeData(fields);
    return (
        <div className="gn-details-info-table">
            <Table head={attributeData.header} body={attributeData.rows} />
        </div>
    );
};

DetailsAttributeTable.propTypes = {
    fields: PropTypes.array,
};

DetailsAttributeTable.defaultProps = {
    fields: []
};

export default DetailsAttributeTable;
