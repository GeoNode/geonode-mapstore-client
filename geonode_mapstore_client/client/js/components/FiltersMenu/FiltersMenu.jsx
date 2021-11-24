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
import FaIcon from '@js/components/FaIcon';
import useLocalStorage from '@js/hooks/useLocalStorage';
import Menu from '@js/components/Menu';
import Spinner from '@js/components/Spinner';

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
    totalFilters,
    filtersActive,
    loading
}, ref) => {

    const selectedSort = orderOptions.find(({ value }) => order === value);
    const [cardLayoutStyle, setCardLayoutStyle] = useLocalStorage('layoutCardsStyle', 'grid');
    function handleToggleCardLayoutStyle() {
        setCardLayoutStyle(cardLayoutStyle === 'grid' ? 'list' : 'grid');
    }
    return (
        <div
            className="gn-filters-menu gn-menu gn-default"
            style={style}
            ref={ref}
        >
            <div className="gn-menu-container">
                <div className="gn-menu-content">
                    <div className="gn-menu-fill">
                        <Button
                            variant={filtersActive ? 'primary' : 'default'}
                            size="sm"
                            onClick={onClick}
                        >
                            <FaIcon name="filter" />
                        </Button>
                        {' '}
                        <Badge>
                            <span className={"resources-count"}> <Message msgId="gnhome.resourcesFound" msgParams={{ count: totalResources }}/> </span>
                            { totalFilters > 0 &&  <> {' '}|{' '}<span onClick={onClick} className={"resources-count"}> <Message msgId="gnhome.filterApplied" msgParams={{ count: totalFilters }}/></span> </>}
                            {' '}
                            { filtersActive &&

                                <span className={"clear-pointer"}
                                    onClick={onClear}
                                ><FaIcon name={"trash"} className={"fa-sm"} />
                                </span>

                            }
                            {loading && <Spinner spinnerName="circle" style={{"float": "right", "paddingLeft": "0.7em"}}noFadeIn/> }
                        </Badge>
                    </div>
                    <Menu
                        items={cardsMenu}
                        containerClass={`gn-menu-list`}
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
                    {orderOptions.length > 0 &&
                    <Dropdown pullRight>
                        <Dropdown.Toggle
                            id="sort-dropdown"
                            bsStyle="default"
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
