import React, { forwardRef } from 'react';
import { Checkbox } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { RESOURCE_MANAGEMENT_PROPERTIES } from '@js/utils/ResourceUtils';
import TimeSeriesSettings from '@js/components/DetailsPanel/DetailsTimeSeries';

const MessageTooltip = tooltip(forwardRef(({children, msgId, ...props}, ref) => {
    return (
        <span {...props} ref={ref}>
            <Message msgId={msgId || ''}>
                {children}
            </Message>
        </span>
    );
}));

function DetailsSettings({ resource, onChange }) {
    const perms = resource?.perms || [];
    return (
        <div className="gn-details-settings">
            <div className="gn-details-info-fields">
                <Message msgId={"gnviewer.resourceManagement"} />
                {Object.keys(RESOURCE_MANAGEMENT_PROPERTIES).map((key) => {
                    const { labelId, disabled, tooltipId } = RESOURCE_MANAGEMENT_PROPERTIES[key];
                    return (
                        <div key={key} className="gn-details-info-row gn-details-flex-field">
                            <Checkbox
                                style={{ margin: 0 }}
                                disabled={disabled(perms)}
                                checked={!!resource?.[key]}
                                onChange={(event) => onChange({ [key]: !!event.target.checked })}
                            >
                                <MessageTooltip msgId={labelId} tooltipId={tooltipId}/>
                            </Checkbox>
                        </div>
                    );
                })}
                <div className="gn-details-info-form">
                    <TimeSeriesSettings resource={resource} onChange={onChange} />
                </div>
            </div>
        </div>
    );
}

export default DetailsSettings;
