import React from 'react';
import PropTypes from 'prop-types';
import { getUserName } from '@js/utils/SearchUtils';
import ALink from '@js/components/ALink';

function AuthorInfo({ resource, readOnly, formatHref, ...props}) {

    return (<p className="card-text gn-card-user" {...props}>
        {resource.owner?.avatar &&
            <img src={resource.owner.avatar} alt={getUserName(resource.owner)} className="gn-card-author-image" />}
        <ALink readOnly={readOnly} href={formatHref({
            query: {
                'filter{owner.username.in}': resource.owner?.username
            }
        })}>{resource.owner && getUserName(resource.owner)}</ALink>
    </p>);
}

AuthorInfo.propTypes = {
    resource: PropTypes.object,
    readOnly: PropTypes.bool,
    formatHref: PropTypes.func,
    props: PropTypes.any
};

AuthorInfo.defaultProps = {
    resource: {},
    readOnly: false,
    formatHref: () => '#'
};

export default AuthorInfo;
