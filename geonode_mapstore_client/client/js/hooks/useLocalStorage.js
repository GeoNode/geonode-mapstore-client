/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState } from 'react';

export default (key, initialValue) => {

    const getValue = () => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // Todo log error in persistent solution
            console.log(`Error to get item key “${key}”:`, error); // eslint-disable-line no-console
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState(getValue);

    const setValue = (value) => {

        try {
            const newValue = value instanceof Function ? value(storedValue) : value;
            setStoredValue(newValue);
            window.localStorage.setItem(key, JSON.stringify(newValue));
            window.dispatchEvent(new Event('localStorage'));
        } catch (error) {
            // Todo log error in persistent solution
            console.log(`Error “${key}”:`, error); // eslint-disable-line no-console
        }
    };

    useEffect(() => {
        setStoredValue(getValue());
    }, []);

    useEffect(() => {
        const handleStoreChange = () => {
            setStoredValue(getValue());
        };
        window.addEventListener('localStorage', handleStoreChange);

        return () => {
            window.removeEventListener('localStorage', handleStoreChange);
        };
    }, []);


    return [storedValue, setValue];
};
