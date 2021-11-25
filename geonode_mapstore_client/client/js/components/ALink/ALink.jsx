import React from 'react';
import PropTypes from 'prop-types';

function ALink({ href, readOnly, children }) {
    return readOnly ? children : <a href={href}>{children}</a>;
}

ALink.PropTypes = {
    href: PropTypes.string,
    readOnly: PropTypes.bool.isRequired,
    children: PropTypes.any
};

ALink.defaultProps = {
    href: '',
    readOnly: false
};

export default ALink;
