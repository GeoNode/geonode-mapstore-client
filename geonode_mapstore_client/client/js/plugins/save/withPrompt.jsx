import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';
import { Prompt } from 'react-router-dom';


export default (Component) => {
    const PromptComponent = (props, {messages}) => {
        const dirtyState = useRef();
        dirtyState.current = props.dirtyState;
        useEffect(() => {
            function onBeforeUnload(event) {
                if (dirtyState.current) {
                    (event || window.event).returnValue = null;
                }
            }
            window.addEventListener('beforeunload', onBeforeUnload);
            return () => {
                window.removeEventListener('beforeunload', onBeforeUnload);
            };
        }, []);

        return props.enabled
            ? <><Component {...props}/>
                <Prompt
                    when={!!props.dirtyState}
                    message={(/* nextLocation, action */) => {
                        const confirmed = window.confirm(getMessageById(messages, 'gnviewer.prompPendingChanges')); // eslint-disable-line no-alert
                        // if confirm the path should be the next one
                        if (confirmed) {
                            return true;
                        }
                        window.history.back(); // to return back to previous path
                        // currently it's not possible to replace the pathname
                        // without side effect
                        // such as reloading of the page
                        return false;
                    }}
                />
            </>
            : null
        ;
    };

    PromptComponent.contextTypes = {
        messages: PropTypes.object
    };
    return PromptComponent;
};
