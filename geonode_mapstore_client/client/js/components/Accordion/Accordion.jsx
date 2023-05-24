/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, {useEffect, useState} from "react";
import uniq from 'lodash/uniq';
import isEmpty from 'lodash/isEmpty';
import PropTypes from "prop-types";

import Button from "@js/components/Button";
import FaIcon from "@js/components/FaIcon";
import useLocalStorage from "@js/hooks/useLocalStorage";
import Message from "@mapstore/framework/components/I18N/Message";
import Spinner from "@js/components/Spinner";
import useIsMounted from "@js/hooks/useIsMounted";

const AccordionTitle = ({
    expanded,
    onClick,
    loading,
    children
}) => {

    return (
        <div className="accordion-title" onClick={onClick}>
            <div className="accordion-title-label">
                {children}
                <Button onClick={onClick} style={{ display: 'block', width: 0, height: 0, overflow: 'hidden', opacity: 0, padding: 0, margin: 0 }}/>
            </div>
            {loading
                ? <Spinner/>
                : <FaIcon name={`caret-${expanded ? "down" : "left"}`}/>
            }
        </div>
    );
};

const Accordion = ({
    title,
    titleId,
    noItemsMsgId,
    identifier,
    content,
    loadItems,
    items
}) => {
    const isMounted = useIsMounted();

    const [accordionsExpanded, setAccordionsExpanded] = useLocalStorage('accordionsExpanded', []);
    const [accordionItems, setAccordionItems] = useState(items);
    const [loading, setLoading] = useState(false);

    const isExpanded = accordionsExpanded.includes(identifier);

    const onClick = () => {
        const expandedList = isExpanded
            ? accordionsExpanded.filter(expanded => expanded !== identifier)
            : uniq(accordionsExpanded.concat(identifier));
        setAccordionsExpanded(expandedList);
    };

    useEffect(()=>{
        if (loadItems && typeof loadItems === 'function') {
            if (isExpanded && !loading) {
                setLoading(true);
                loadItems({ page_size: 999999 })
                    .then((response) =>{
                        isMounted(() => setAccordionItems(response.items));
                    })
                    .finally(()=> isMounted(() => setLoading(false)));
            }
        }
    }, [isExpanded]);

    return (
        <div className={'gn-accordion'}>
            <AccordionTitle
                expanded={isExpanded}
                onClick={onClick}
                loading={loading}
            >
                {titleId ? <Message msgId={titleId}/> : title}
            </AccordionTitle>
            {isExpanded ? <div className="accordion-body">
                <div className={'accordion-items'}>
                    {!isEmpty(accordionItems)
                        ? content(accordionItems)
                        : !loading
                            ? <Message msgId={noItemsMsgId}/>
                            : null}
                </div>
            </div> : null}
        </div>
    );
};

Accordion.propTypes = {
    title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    titleId: PropTypes.string,
    identifier: PropTypes.string,
    content: PropTypes.func,
    loadItems: PropTypes.func,
    items: PropTypes.array
};

Accordion.defaultProps = {
    title: null,
    identifier: "",
    content: () => null,
    noItemsMsgId: "gnhome.emptyAccordion"
};
export default Accordion;
