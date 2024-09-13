import React from 'react';
import { Checkbox } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import { RESOURCE_MANAGEMENT_PROPERTIES } from '@js/utils/ResourceUtils';

function DetailsManagement({ resource, onChange }) {
    const perms = resource?.perms || [];
    return (
        <div className="gn-details-management">
            <div className="gn-details-info-fields">
                <Message msgId={"gnviewer.resourceManagement"} />
                {Object.keys(RESOURCE_MANAGEMENT_PROPERTIES).map((key) => {
                    const { labelId, disabled } = RESOURCE_MANAGEMENT_PROPERTIES[key];
                    return (
                        <div key={key} className="gn-details-info-row gn-details-flex-field">
                            <Checkbox
                                style={{ margin: 0 }}
                                disabled={disabled(perms)}
                                checked={!!resource?.[key]}
                                onChange={(event) => onChange({ [key]: !!event.target.checked })}
                            >
                                <Message msgId={labelId} />
                            </Checkbox>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default DetailsManagement;
