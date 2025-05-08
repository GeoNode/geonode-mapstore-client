import React, { forwardRef } from 'react';
import { Checkbox } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { RESOURCE_MANAGEMENT_PROPERTIES } from '@js/utils/ResourceUtils';
import TimeSeriesSettings from './DetailsTimeSeries';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';

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
        <FlexBox column gap="md" className="gn-details-settings _padding-tb-md">
            <FlexBox column gap="xs">
                <Text fontSize="sm">
                    <Message msgId={"gnviewer.resourceManagement"} />
                </Text>
                {Object.keys(RESOURCE_MANAGEMENT_PROPERTIES).map((key) => {
                    const { labelId, disabled, tooltipId } = RESOURCE_MANAGEMENT_PROPERTIES[key];
                    return (
                        <Text key={key} fontSize="sm" className="_row _padding-b-xs">
                            <Checkbox
                                style={{ margin: 0 }}
                                disabled={disabled(perms)}
                                checked={!!resource?.[key]}
                                onChange={(event) => onChange({ [key]: !!event.target.checked })}
                            >
                                <MessageTooltip msgId={labelId} tooltipId={tooltipId}/>
                            </Checkbox>
                        </Text>
                    );
                })}
            </FlexBox>
            <TimeSeriesSettings resource={resource} onChange={onChange} />
        </FlexBox>
    );
}

export default DetailsSettings;
