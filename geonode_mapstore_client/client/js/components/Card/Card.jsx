/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';
import ResourceCard from '@js/components/ResourceCard';
import { withResizeDetector } from 'react-resize-detector';
import { getResourceStatuses } from '@js/utils/ResourceUtils';

const Cards = ({
    resources,
    formatHref,
    isCardActive,
    buildHrefByTemplate,
    containerWidth,
    width: detectedWidth,
    options,
    onResize,
    actions,
    onAction
}) => {
    const width = detectedWidth || containerWidth;
    const margin = 24;
    const size = 320;
    const countNum = Math.floor(width / (size + margin));
    const count = countNum > 4 ? 4 : countNum; // limit count in order not to request for more than 4 per page
    const cardWidth = width >= size + margin * 2
        ? Math.floor((width - margin * count) / count)
        : '100%';
    useEffect(() => {
        onResize(count);
    }, [count]);
    const ulPadding = Math.floor(margin / 2);
    const isSingleCard = count === 0 || count === 1;

    const gridLayoutSpace = (idx) => {

        const gridSpace = isSingleCard
            ? {
                width: width - margin,
                margin: ulPadding
            }
            : {
                width: cardWidth,
                marginRight: (idx + 1) % count === 0 ? 0 : margin,
                marginTop: 8
            };

        return gridSpace;
    };

    const containerStyle = isSingleCard
        ? {
            paddingBottom: 0
        }
        : {
            paddingLeft: ulPadding,
            paddingBottom: 0
        };
    return (detectedWidth ?
        <ul
            style={containerStyle}
        >
            {resources.map((resource, idx) => {
                const {
                    isProcessing,
                    isDeleted
                } = getResourceStatuses(resource);

                if (isDeleted) {
                    return null;
                }

                return (
                    <li
                        key={resource?.pk}
                        style={(gridLayoutSpace(idx))}
                    >
                        <ResourceCard
                            active={isCardActive(resource)}
                            className={`${isDeleted ? 'deleted' : ''}`}
                            data={resource}
                            formatHref={formatHref}
                            options={options}
                            buildHrefByTemplate={buildHrefByTemplate}
                            layoutCardsStyle="grid"
                            loading={isProcessing}
                            readOnly={isDeleted || isProcessing}
                            featured
                            actions={actions}
                            onAction={onAction}
                        />
                    </li>
                );
            })}
        </ul> : <div />
    );
};

export default withResizeDetector(Cards);
