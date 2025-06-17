import React, { forwardRef } from 'react';
import { Checkbox, FormGroup, ControlLabel } from 'react-bootstrap';

import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import SelectInfiniteScroll from '@mapstore/framework/plugins/ResourcesCatalog/components/SelectInfiniteScroll';
import { getGroups } from '@js/api/geonode/v2';
import { canAccessPermissions, canManageResourceSettings, RESOURCE_MANAGEMENT_PROPERTIES } from '@js/utils/ResourceUtils';
import DetailsPermissions from '@js/plugins/ResourceDetails/containers/Permissions';

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
    return (
        <FlexBox column gap="md" className="gn-details-settings _padding-tb-md">
            <FlexBox.Fill gap="xs" className="_padding-b-xs">
                <FormGroup>
                    <ControlLabel><Message msgId={"gnviewer.group"} /></ControlLabel>
                    <SelectInfiniteScroll
                        clearable
                        disabled={!(resource?.perms || []).includes('change_resourcebase')}
                        value={{ label: resource?.group?.name, value: resource?.group }}
                        placeholder={"gnviewer.groupPlaceholder"}
                        onChange={(selected) => onChange({ group: selected?.value ?? null})}
                        loadOptions={({ q, ...params }) => getGroups({q, ...params})
                            .then((response) => {
                                return {
                                    ...response,
                                    results: (response?.groups ?? [])
                                        .map((item) => ({...item, selectOption: {
                                            value: item.group,
                                            label: item.group.name
                                        }}))
                                };
                            })
                        }
                    />
                </FormGroup>
            </FlexBox.Fill>
            {canAccessPermissions(resource) && <DetailsPermissions resource={resource} />}
            {canManageResourceSettings(resource) && (
                <FlexBox column gap="xs">
                    <Text strong>
                        <Message msgId={"gnviewer.resourceManagement"} />
                    </Text>
                    {Object.keys(RESOURCE_MANAGEMENT_PROPERTIES).map((key) => {
                        const { labelId, disabled, tooltipId } = RESOURCE_MANAGEMENT_PROPERTIES[key];
                        return (
                            <Text key={key} fontSize="sm" className="_row _padding-b-xs">
                                <Checkbox
                                    style={{ margin: 0 }}
                                    disabled={disabled(resource?.perms || [])}
                                    checked={!!resource?.[key]}
                                    onChange={(event) => onChange({ [key]: !!event.target.checked })}
                                >
                                    <MessageTooltip msgId={labelId} tooltipId={tooltipId}/>
                                </Checkbox>
                            </Text>
                        );
                    })}
                </FlexBox>
            )}
        </FlexBox>
    );
}

export default DetailsSettings;
