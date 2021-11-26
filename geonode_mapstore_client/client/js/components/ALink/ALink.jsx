import React from 'react';
import PropTypes from 'prop-types';

function ALink({ href, readOnly, children, ...props }) {
    return readOnly ? children : <a href={href} {...props}>{children}</a>;
}

ALink.propTypes = {
    href: PropTypes.string,
    readOnly: PropTypes.bool.isRequired,
    children: PropTypes.any
};

ALink.defaultProps = {
    href: '',
    readOnly: false
};

export default ALink;
