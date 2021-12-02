/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import GeneralSettings from '@js/plugins/layersettings/GeneralSettings';
import VisibilitySettings from '@js/plugins/layersettings/VisibilitySettings';
import SettingsSection from '@js/plugins/layersettings/SettingsSection';
import useLocalStorage from '@js/hooks/useLocalStorage';
import Message from '@mapstore/framework/components/I18N/Message';

function BaseLayerSettings({
    node = {},
    resolutions,
    projection,
    onChange = () => {},
    zoom,
    groups = [],
    currentLocale
}) {
    const [settingsSections, setSettingsSections] = useLocalStorage('settings-section', {
        general: true,
        visibility: false
    });
    function handleChangeSection(key, value) {
        setSettingsSections({
            ...settingsSections,
            [key]: value
        });
    }
    return (
        <>
            <SettingsSection
                title={<Message msgId="gnviewer.generalSettings" />}
                expanded={settingsSections?.general}
                onChange={handleChangeSection.bind(null, 'general')}
            >
                <GeneralSettings
                    node={node}
                    onChange={onChange}
                    nodeType="layer"
                    groups={groups}
                    currentLocale={currentLocale}
                />
            </SettingsSection>
            <SettingsSection
                title={<Message msgId="gnviewer.visibilitySettings" />}
                expanded={settingsSections?.visibility}
                onChange={handleChangeSection.bind(null, 'visibility')}
            >
                <VisibilitySettings
                    node={node}
                    resolutions={resolutions}
                    projection={projection}
                    onChange={onChange}
                    zoom={zoom}
                />
            </SettingsSection>
        </>
    );
}

export default BaseLayerSettings;
