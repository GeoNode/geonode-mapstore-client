/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ResourceCard from '@js/components/ResourceCard';
import { getResourceStatuses } from '@js/utils/ResourceUtils';

const Cards = ({
    resources,
    formatHref,
    isCardActive,
    buildHrefByTemplate,
    options,
    downloading,
    getDetailHref
}) => {
    return (
        <ul
            className={`gn-card-list gn-cards-type-grid`}
        >
            {resources.map((resource) => {
                const { isProcessing } = getResourceStatuses(resource);

                return (
                    <li
                        key={resource?.pk}
                    >
                        <ResourceCard
                            active={isCardActive(resource)}
                            data={resource}
                            formatHref={formatHref}
                            options={options}
                            buildHrefByTemplate={buildHrefByTemplate}
                            layoutCardsStyle="grid"
                            loading={isProcessing}
                            readOnly={isProcessing}
                            featured
                            downloading={downloading?.find((download) => download.pk === resource.pk) ? true : false}
                            getDetailHref={getDetailHref}
                        />
                    </li>
                );
            })}
        </ul>
    );
};

export default Cards;
