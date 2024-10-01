/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';
import Button from '@js/components/Button';
import Spinner from '@js/components/Spinner';
import HTML from '@mapstore/framework/components/I18N/HTML';
import FaIcon from '@js/components/FaIcon';
import { withResizeDetector } from 'react-resize-detector';
import Cards from './Cards';

const FeaturedList = withResizeDetector(({
    resources,
    loading,
    isNextPageAvailable,
    formatHref,
    isCardActive,
    containerStyle,
    header,
    buildHrefByTemplate,
    isPreviousPageAvailable,
    loadFeaturedResources,
    onLoad,
    width,
    downloading,
    getDetailHref,
    cardsCount = 4
}) => {

    const nextIconStyles = {
        fontSize: '1rem',
        ...(!isNextPageAvailable || loading ? {color: 'grey', cursor: 'not-allowed'} : {cursor: 'pointer'})
    };

    const previousIconStyles = {
        fontSize: '1rem',
        ...(!isPreviousPageAvailable || loading ? { color: 'grey', cursor: 'not-allowed' } : { cursor: 'pointer' })
    };

    useEffect(() => {
        onLoad(undefined, cardsCount);
    }, [cardsCount]);

    return (
        <div className="gn-card-grid" style={resources.length === 0 ? { display: 'none' } : {}}>
            {header}
            <div className="gn-card-grid-container" style={containerStyle}>
                <h3><HTML msgId={`gnhome.featuredList`}/></h3>
                <Cards
                    featured
                    resources={resources}
                    formatHref={formatHref}
                    isCardActive={isCardActive}
                    buildHrefByTemplate={buildHrefByTemplate}
                    containerWidth={width}
                    downloading={downloading}
                    getDetailHref={getDetailHref}
                />
                <div className="gn-card-grid-pagination featured-list">

                    <Button size="sm" onClick={() => loadFeaturedResources("previous", cardsCount)} disabled={!isPreviousPageAvailable || loading}
                        aria-hidden="true">
                        <FaIcon  style={previousIconStyles} name="caret-left"/>
                    </Button>

                    <div>
                        { loading && <Spinner size="sm"  animation="border" role="status">
                            <span className="sr-only">Loading...</span>
                        </Spinner>}
                    </div>
                    <Button size="sm" onClick={() => loadFeaturedResources("next", cardsCount)} disabled={!isNextPageAvailable || loading}
                        aria-hidden="true">
                        <FaIcon style={nextIconStyles} name="caret-right"/>

                    </Button>
                </div>
            </div>
        </div>
    );
});

FeaturedList.defaultProps = {
    page: 1,
    resources: [],
    isNextPageAvailable: false,
    loading: false,
    formatHref: () => '#',
    isCardActive: () => false,
    isPreviousPageAvailable: false,
    onLoad: () => { }
};

export default FeaturedList;
