/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import Text from '@mapstore/framework/components/layout/Text';
import Message from '@mapstore/framework/components/I18N/Message';
import TimeSeriesSettings from '@js/plugins/ResourceDetails/components/DetailsTimeSeries';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';

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


const DetailsData = ({ fields, resource, onChange }) => {
    const attributeData = parseAttributeData(fields);
    return (
        <FlexBox column gap="sm" className="gn-details-data _padding-tb-md">
            <FlexBox column className="gn-details-data-table">
                <Text strong>
                    <Message msgId={"gnviewer.attributes"} />
                </Text>
                <Text fontSize="sm">
                    <table className="table">
                        <thead>
                            <tr>
                                {attributeData.header.map(({ value }, idx) => {
                                    return (<th key={idx}>{value}</th>);
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {attributeData.rows.map((row, rowIdx) => {
                                return (<tr key={rowIdx}>
                                    {attributeData.header.map((column, idx) => <td key={idx} >{row[column.key]}</td>)}
                                </tr>);
                            })}
                        </tbody>
                    </table>
                </Text>
            </FlexBox>
            <TimeSeriesSettings resource={resource} onChange={onChange} />
        </FlexBox>
    );
};

DetailsData.propTypes = {
    fields: PropTypes.array
};

DetailsData.defaultProps = {
    fields: []
};

export default DetailsData;
