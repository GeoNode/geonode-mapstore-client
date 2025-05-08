import React from 'react';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';

function DetailsAssets({ fields }) {
    return (
        <FlexBox column gap="xs" className="gn-details-assets _padding-tb-md">
            {fields.map((field, idx) => {
                const asset = field?.extras?.content || {};
                return (
                    <FlexBox gap="sm" centerChildrenVertically component={Text} key={idx} fontSize="sm" className="_row _padding-b-xs">
                        <Icon glyph="file" />
                        {asset.download_url ? <a
                            download
                            href={asset.download_url}
                        >
                            {asset.title}{' '}<Icon glyph="download" />
                        </a> : asset.title}
                    </FlexBox>
                );
            })}
        </FlexBox>
    );
}

export default DetailsAssets;
