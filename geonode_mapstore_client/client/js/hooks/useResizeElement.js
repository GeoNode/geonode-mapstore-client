/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState, useEffect } from 'react';

const useResizeElement = (elemRef) => {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const handleResize = () => {
        if (elemRef.current) {
            setWidth(elemRef.current.offsetWidth);
            setHeight(elemRef.current.offsetHeight);
        }
    };
    useEffect(() => {

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [elemRef]);

    useEffect(() => {
        handleResize();
    });

    return { width, height };
};

export default useResizeElement;
