/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';
import { Dropdown, Button, Badge } from 'react-bootstrap-v1';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/home/FaIcon';
import useLocalStorage from '@js/hooks/useLocalStorage';
import Menu from '@js/components/Menu';

const FiltersMenu = forwardRef(({
    formatHref,
    orderOptions,
    order,
    cardsMenu,
    style,
    onClick,
    defaultLabelId,
    onClear,
    totalResources,
    filtersActive
}, ref) => {

    const selectedSort = orderOptions.find(({ value }) => order === value);
    const [cardLayoutStyle, setCardLayoutStyle] = useLocalStorage('layoutCardsStyle');
    function handleToggleCardLayoutStyle() {
        setCardLayoutStyle(cardLayoutStyle === 'grid' ? 'list' : 'grid');
    }
    return (
        <div
            className="gn-filters-menu"
            style={style}
            ref={ref}
        >
            <div className="gn-filters-menu-container">
                <div className="gn-filters-menu-main">
                    <Button
                        variant="default"
                        size="sm"
                        active={filtersActive}
                        onClick={onClick}
                    >
                        <Message msgId="gnhome.filters" />
                    </Button>
                    {filtersActive && <Button
                        variant="default"
                        size="sm"
                        onClick={onClear}
                    >
                        <Message msgId="gnhome.clearFilters"/>
                    </Button>}
                    {' '}
                    <Badge><Message msgId="gnhome.resourcesFound" msgParams={{ count: totalResources }}/></Badge>
                </div>
                <Menu
                    items={cardsMenu}
                    containerClass={`gn-cards-menu`}
                    size="sm"
                    alignRight
                />
                <Button
                    variant="default"
                    onClick={handleToggleCardLayoutStyle}
                    size="sm"
                >
                    <FaIcon name={cardLayoutStyle === 'grid' ? 'list' : 'th'} />
                </Button>
                <div className="gn-filters-menu-tools">

                    {orderOptions.length > 0 && <Dropdown alignRight>
                        <Dropdown.Toggle
                            id="sort-dropdown"
                            variant="default"
                            size="sm"
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
                    </Dropdown>}
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
