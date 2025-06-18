/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useRef } from 'react';

// based on https://stackoverflow.com/questions/32553158/detect-click-outside-react-component

/**
 * Detect a click out event given a target node
 * @name useDetectClickOut
 * @memberof hooks
 * @prop {boolean} disabled ensure the callback is not triggered
 * @prop {function} onClickOut callback on click outside the targeted node
 * @example
 * function Panel({ onClose }) {
 *  const targetedNode = useDetectClickOut({ onClickOut: onClose });
 *  return (
 *      <div ref={targetedNode}></div>
 *  );
 * }
 */
function useDetectClickOut({
    disabled,
    onClickOut
}) {
    const node = useRef();
    useEffect(() => {
        function handleClickOut(event) {
            if (disabled || !node.current) return;
            const target = event.target;
            const isNode = target instanceof Node;
            if ((isNode && !node.current.contains(target))
                || document.activeElement === document.querySelector("iframe")
            ) {
                onClickOut();
            }
        }
        window.addEventListener('mousedown', handleClickOut);
        window.addEventListener('blur', handleClickOut);
        return () => {
            window.removeEventListener('mousedown', handleClickOut);
            window.removeEventListener('blur', handleClickOut);
        };
    }, [ disabled, node, onClickOut ]);
    return node;
}

export default useDetectClickOut;
