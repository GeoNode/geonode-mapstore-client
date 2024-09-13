import React from 'react';
import FaIcon from '@js/components/FaIcon';

function DetailsAssets({ fields }) {
    return (
        <div className="gn-details-assets">
            <div className="gn-details-info-fields">
                {fields.map((field, idx) => {
                    const asset = field?.extras?.content || {};
                    return (
                        <div key={idx} className="gn-details-info-row gn-details-flex-field">
                            <FaIcon name="file" />
                            {asset.download_url ? <a
                                download
                                href={asset.download_url}
                            >
                                {asset.title}{' '}<FaIcon name="download" />
                            </a> : asset.title}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default DetailsAssets;
