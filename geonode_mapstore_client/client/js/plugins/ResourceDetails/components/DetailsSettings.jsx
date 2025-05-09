import React, { forwardRef } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Checkbox, FormGroup, ControlLabel } from 'react-bootstrap';

import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { GROUP_OWNER_PROPERTIES, RESOURCE_MANAGEMENT_PROPERTIES } from '@js/utils/ResourceUtils';
import TimeSeriesSettings from '@js/plugins/ResourceDetails/components/DetailsTimeSeries';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import SelectInfiniteScroll from '@mapstore/framework/plugins/ResourcesCatalog/components/SelectInfiniteScroll';
import { getCompactPermissions } from '@js/selectors/resource';

const MessageTooltip = tooltip(forwardRef(({children, msgId, ...props}, ref) => {
    return (
        <span {...props} ref={ref}>
            <Message msgId={msgId || ''}>
                {children}
            </Message>
        </span>
    );
}));

function DetailsSettings({ resource, user, compactPermissions, onChange }) {
    const perms = resource?.perms || [];
    return (
        <FlexBox column gap="md" className="gn-details-settings _padding-tb-md">
            <FlexBox gap="xs" className="_row _padding-b-xs">
                {Object.keys(GROUP_OWNER_PROPERTIES).map((key) => {
                    const { labelId, disabled, placeholderId, labelKey, loadOptions, clearable } =
                    GROUP_OWNER_PROPERTIES[key];
                    return (
                        <FlexBox.Fill key={key} gap="sm">
                            <FormGroup>
                                <ControlLabel><Message msgId={labelId} /></ControlLabel>
                                <SelectInfiniteScroll
                                    clearable={clearable}
                                    disabled={disabled({perms, user})}
                                    value={{label: resource?.[key]?.[labelKey], value: resource?.[key]}}
                                    placeholder={placeholderId}
                                    onChange={(selected) => {
                                        onChange({
                                            [key]: selected?.value ?? null
                                        });
                                    }}
                                    loadOptions={(...args) => loadOptions(...args, compactPermissions)}
                                />
                            </FormGroup>
                        </FlexBox.Fill>
                    );
                })}
            </FlexBox>
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

export default connect(
    createStructuredSelector({
        compactPermissions: getCompactPermissions
    }), {}
)(DetailsSettings);
