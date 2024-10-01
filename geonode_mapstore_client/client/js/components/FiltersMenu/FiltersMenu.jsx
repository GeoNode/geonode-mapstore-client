/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';
import Dropdown from '@js/components/Dropdown';
import Button from '@js/components/Button';
import Badge from '@js/components/Badge';
import Message from '@mapstore/framework/components/I18N/Message';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import FaIcon from '@js/components/FaIcon';
import Menu from '@js/components/Menu';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import Spinner from '@js/components/Spinner/Spinner';

const ButtonWithTooltip = tooltip(Button);

const FiltersMenu = forwardRef(({
    formatHref,
    order,
    cardsMenu,
    style,
    onClick,
    totalResources,
    totalFilters,
    loading,
    hideCardLayoutButton,
    cardLayoutStyle,
    setCardLayoutStyle,
    orderConfig
}, ref) => {

    const {
        defaultLabelId,
        options: orderOptions,
        variant: orderVariant,
        align: orderAlign = 'right'
    } = orderConfig;

    const { isMobile } = getConfigProp('geoNodeSettings');
    const selectedSort = orderOptions.find(({ value }) => order === value);
    function handleToggleCardLayoutStyle() {
        setCardLayoutStyle(cardLayoutStyle === 'grid' ? 'list' : 'grid');
    }

    const orderButtonNode = orderOptions.length > 0 &&
        <Dropdown pullRight={orderAlign === 'right'} id="sort-dropdown">
            <Dropdown.Toggle
                bsStyle={orderVariant || 'default'}
                bsSize="sm"
                noCaret
            >
                <Message msgId={selectedSort?.labelId || defaultLabelId} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
                {orderOptions.map(({ labelId, value }) => {
                    return (
                        <Dropdown.Item
                            key={value}
                            active={value === selectedSort?.value}
                            href={formatHref({
                                query: {
                                    sort: [value]
                                },
                                replaceQuery: true
                            })}
                        >
                            <Message msgId={labelId} />
                        </Dropdown.Item>
                    );
                })}
            </Dropdown.Menu>
        </Dropdown>;

    return (
        <div
            className="gn-filters-menu gn-menu gn-default"
            style={style}
            ref={ref}
        >
            <div className="gn-menu-container">
                <div className="gn-menu-content">
                    <div className="gn-menu-fill">
                        {totalFilters > 0 ? <ButtonWithTooltip
                            variant="primary"
                            size="sm"
                            onClick={onClick}
                            className="gn-success-changes-icon"
                            tooltip={<Message msgId="gnhome.filterApplied" msgParams={{ count: totalFilters }}/>}
                        >
                            {isMobile ? <FaIcon name="filter" /> : <Message msgId="gnhome.filter"/>}
                        </ButtonWithTooltip> : <Button
                            variant="primary"
                            size="sm"
                            onClick={onClick}
                        >
                            {isMobile ? <FaIcon name="filter" /> : <Message msgId="gnhome.filter"/>}
                        </Button>}
                        {orderAlign === 'left' ? orderButtonNode : null}
                        {loading ? <span className="resources-count-loading"><Spinner /></span> : <Badge>
                            <span className="resources-count"> <Message msgId="gnhome.resourcesFound" msgParams={{ count: totalResources }}/> </span>
                        </Badge>}
                    </div>
                    <Menu
                        items={cardsMenu}
                        containerClass={`gn-menu-list`}
                        size="md"
                        alignRight
                    />
                    {!hideCardLayoutButton && <Button
                        variant="default"
                        onClick={handleToggleCardLayoutStyle}
                        size="sm"
                    >
                        <FaIcon name={cardLayoutStyle === 'grid' ? 'list' : 'th'} />
                    </Button>}
                    {orderAlign === 'right' ? orderButtonNode : null}
                </div>
            </div>
        </div>
    );
});

FiltersMenu.defaultProps = {
    orderOptions: [
        {
            label: 'Most recent',
            labelId: 'gnhome.mostRecent',
            value: '-date'
        },
        {
            label: 'Less recent',
            labelId: 'gnhome.lessRecent',
            value: 'date'
        },
        {
            label: 'A Z',
            labelId: 'gnhome.aZ',
            value: 'title'
        },
        {
            label: 'Z A',
            labelId: 'gnhome.zA',
            value: '-title'
        },
        {
            label: 'Most popular',
            labelId: 'gnhome.mostPopular',
            value: 'popular_count'
        }
    ],
    defaultLabelId: 'gnhome.orderBy',
    formatHref: () => '#',
    onClear: () => { }
};

export default FiltersMenu;
