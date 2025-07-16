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
 * @prop {string[]} extraNodes extra selectors to check if the click is inside
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
    extraNodes,
    disabled,
    onClickOut
}) {
    const node = useRef();
    useEffect(() => {
        function handleClickOut(event) {
            if (disabled || !node.current) return;
            const target = event.target;
            const isNode = target instanceof Node;

            // Check if click is inside any extraNodes
            const isInsideExtra = extraNodes?.some(extra => document.querySelector(extra)?.contains(target));

            const isInsideNode = isNode
                ? !node.current.contains(target) && !isInsideExtra
                : document.activeElement === document.querySelector("iframe");

            isInsideNode && onClickOut();
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
