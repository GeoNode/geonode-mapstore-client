import React from 'react';
import PropTypes from 'prop-types';

import PendingStatePrompt from '@mapstore/framework/plugins/ResourcesCatalog/containers/PendingStatePrompt';

export default (Component) => {
    const PromptComponent = (props) => {
        return props.enabled
            ? <>
                <Component {...props}/>
                <PendingStatePrompt
                    show={props.show}
                    onCancel={props.onCancel}
                    onConfirm={props.onConfirm}
                    pendingState={!!props.dirtyState}
                    titleId="resourcesCatalog.detailsPendingChangesTitle"
                    descriptionId="resourcesCatalog.detailsPendingChangesDescription"
                    cancelId="resourcesCatalog.detailsPendingChangesCancel"
                    confirmId="resourcesCatalog.detailsPendingChangesConfirm"
                    variant="danger"
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
