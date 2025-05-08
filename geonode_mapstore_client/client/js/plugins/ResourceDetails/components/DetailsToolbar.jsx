/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import CopyToClipboardCmp from 'react-copy-to-clipboard';

import Message from '@mapstore/framework/components/I18N/Message';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import Icon from "@mapstore/framework/plugins/ResourcesCatalog/components/Icon";
import Button from '@mapstore/framework/components/layout/Button';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import ResourceStatus from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourceStatus';
import useIsMounted from '@mapstore/framework/hooks/useIsMounted';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';

const ButtonWithTooltip = tooltip(Button);
const CopyToClipboard = tooltip(CopyToClipboardCmp);

function DetailsToolbarButton({
    glyph,
    iconType,
    labelId,
    onClick,
    square,
    variant,
    borderTransparent,
    loading,
    ...props
}) {
    function handleOnClick(event) {
        event.stopPropagation();
        if (onClick) {
            onClick(event);
        }
    }
    return (
        <ButtonWithTooltip
            variant={variant}
            square={square}
            borderTransparent={borderTransparent}
            {...props}
            tooltipId={square && labelId ? labelId : null}
            onClick={handleOnClick}
        >
            {!loading && glyph ? <><Icon type={iconType} glyph={glyph}/></> : null}
            {!loading && glyph && labelId ? ' ' : null}
            {!loading && labelId && !square ? <Message msgId={labelId} /> : null}
            {loading ? <Spinner /> : null}
        </ButtonWithTooltip>
    );
}

function formatResourceLinkUrl(resource) {
    if (resource?.uuid) {
        return window.location.href.replace(/#.+$/, `uuid/${resource.uuid}`);
    }
    return window.location.href;
}

function DetailsToolbar({
    resource,
    items = []
}) {

    const {
        status,
        info
    } = resource?.['@extras'] || {};

    const [copiedUrl, setCopiedUrl] = useState({
        resource: false,
        datasetowsurl: false
    });

    const isMounted = useIsMounted();
    const handleCopyPermalink = (type) => {
        setCopiedUrl({ ...copiedUrl, [type]: true });
        setTimeout(() => {
            isMounted(() => {
                setCopiedUrl({...copiedUrl, [type]: false});
            });
        }, 700);
    };

    return (
        <FlexBox style={{ alignItems: 'flex-start' }}>
            <FlexBox gap="xs" centerChildrenVertically>
                <ResourceStatus statusItems={status?.items} />
                {items.map(({ name, Component }) => (<Component
                    showIcon
                    key={name}
                    resource={resource}
                    component={DetailsToolbarButton}
                />))}
                <CopyToClipboard
                    tooltipPosition="top"
                    tooltipId={
                        copiedUrl.resource
                            ? 'gnhome.copiedResourceUrl'
                            : 'gnhome.copyResourceUrl'
                    }
                    text={formatResourceLinkUrl(resource)}
                >
                    <Button
                        variant="default"
                        onClick={()=> handleCopyPermalink('resource')}>
                        <Icon glyph="share-alt" />
                    </Button>
                </CopyToClipboard>
                {resource?.dataset_ows_url && <CopyToClipboard
                    tooltipPosition="top"
                    tooltipId={
                        copiedUrl.capabilities
                            ? 'gnhome.copiedDatasetOwsUrl'
                            : 'gnhome.copyDatasetOwsUrl'
                    }
                    text={resource.dataset_ows_url}
                >
                    <Button
                        variant="default"
                        onClick={()=> handleCopyPermalink('datasetowsurl')}>
                        <Icon glyph="globe" />
                    </Button>
                </CopyToClipboard>}
                {info?.viewerUrl
                    ? (
                        <Button
                            variant="primary"
                            href={info?.viewerUrl}
                            rel="noopener noreferrer">
                            <Message msgId={`gnhome.view${info?.typeName}`} />
                        </Button>
                    )
                    : info?.metadataDetailUrl
                        ? (
                            <Button
                                variant="primary"
                                href={info?.metadataDetailUrl}
                                rel="noopener noreferrer">
                                <Message msgId={`gnhome.viewMetadata`} />
                            </Button>
                        )
                        : null}
            </FlexBox>
        </FlexBox>
    );
}

export default DetailsToolbar;
