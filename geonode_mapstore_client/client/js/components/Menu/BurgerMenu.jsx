
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import DropdownList from '@js/components/Menu/DropdownList';

const BurgerMenu = ({items}) => {

    return (
        <div className={`gn-sub-flat-menu-container`} >
            <DropdownList
                toogleIcon={`bars`}
                className={`gn-sub-flat-menu`}
                items={items}
            />
        </div>

    );
};

export default BurgerMenu;
