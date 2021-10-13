/* eslint-disable no-script-url */
/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Tabs from '@js/components/Tabs';
import DefinitionList from '@js/components/DefinitionList';
import Table from '@js/components/Table';
import Spinner from '@js/components/Spinner';
import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import moment from 'moment';
import { getUserName } from '@js/utils/SearchUtils';
import { getResourceTypesInfo, getMetadataDetailUrl } from '@js/utils/ResourceUtils';
import debounce from 'lodash/debounce';
import CopyToClipboardCmp from 'react-copy-to-clipboard';
import { TextEditable, ThumbnailEditable } from '@js/components/ContentsEditable/';
import ResourceStatus from '@js/components/ResourceStatus/';

const CopyToClipboard = tooltip(CopyToClipboardCmp);

const EditTitle = ({ title, onEdit, tagName, disabled }) => {
    return (
        <div className="editContainer">
            <TextEditable
                tagName={tagName}
                onEdit={onEdit}
                text={title}
                disabled={disabled}
            />
        </div>);
};

const EditAbstract = ({ abstract, onEdit, tagName, disabled }) => (
    <div className="editContainer">
        <TextEditable
            tagName={tagName}
            onEdit={onEdit}
            text={abstract}
            disabled={disabled}
        />
    </div>

);


const EditThumbnail = ({ image, onEdit }) => (
    <div className="editContainer imagepreview">
        <ThumbnailEditable onEdit={onEdit} defaultImage={image} />
    </div>

);


function formatResourceLinkUrl(resourceUrl = '') {
    if (resourceUrl.indexOf('http') === 0) {
        return resourceUrl;
    }
    return window.location.href;
}

function ThumbnailPreview({
    src,
    style,
    ...props
}) {

    const [loading, setLoading] = useState();

    useEffect(() => {
        if (src && !loading) {
            setLoading(true);
        }
    }, [src]);

    return (
        <img
            {...props}
            src={src}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            style={{
                ...style,
                ...(loading && {
                    backgroundColor: 'transparent'
                }),
                objectFit: 'contain'
            }}
        />
    );
}


const DefinitionListMoreItem = ({itemslist, extraItemsList}) => {

    const [extraItems, setExtraItems] = useState(false);
    const handleMoreInfo = () => {
        setExtraItems(!extraItems);
    };

    return (
        <div className="DList-containner">
            <DefinitionList itemslist={itemslist} />

            { extraItemsList.length > 0 && <a className={"moreinfo"} href="javascript:void(0);"  onClick={handleMoreInfo}><Message msgId={"gnviewer.moreinfo"} /></a> }

            {extraItemsList.length > 0 && extraItems && <DefinitionList itemslist={extraItemsList} />}
        </div>


    );
};

function DetailsPanel({
    resource,
    formatHref,
    linkHref,
    sectionStyle,
    loading,
    getTypesInfo,
    editTitle,
    editAbstract,
    editThumbnail,
    activeEditMode,
    closePanel,
    favorite,
    onFavorite,
    enableFavorite,
    buttonSaveThumbnailMap
}) {
    const detailsContainerNode = useRef();
    const isMounted = useRef();
    const [copiedResourceLink, setCopiedResourceLink] = useState(false);
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    if (!resource && !loading) {
        return null;
    }

    const handleCopyPermalink = () => {
        setCopiedResourceLink(true);
        setTimeout(() => {
            if (isMounted.current) {
                setCopiedResourceLink(false);
            }
        }, 700);
    };

    const handleFavorite = () => {
        onFavorite(!favorite);
    };

    const types = getTypesInfo();
    const {
        formatEmbedUrl = res => res?.embed_url,
        formatDetailUrl = res => res?.detail_url,
        canPreviewed,
        icon,
        name
    } = resource && (types[resource.subtype] || types[resource.resource_type]) || {};
    const embedUrl = resource?.embed_url && formatEmbedUrl(resource);
    const detailUrl = resource?.pk && formatDetailUrl(resource);
    const resourceCanPreviewed = resource?.pk && canPreviewed && canPreviewed(resource);
    const documentDownloadUrl = (resource?.href && resource?.href.includes('download')) ? resource?.href : undefined;
    const attributeSet = resource?.attribute_set;
    const metadataDetailUrl = resource?.pk && getMetadataDetailUrl(resource);

    const validateDataType = (data) => {

        let dataType;
        switch (true) {
        case data === 'None':
        case data?.length === 0:
            dataType = undefined;
            break;
        default:
            dataType = data;
        }


        return dataType;
    };

    const infoField = [
        {
            "label": "Title",
            "value": validateDataType(resource?.title)
        },
        {
            "label": "Abstract",
            "value": validateDataType(resource?.raw_abstract)
        },
        {
            "label": "Owner",
            "value": validateDataType(resource?.owner?.username) && <a href={`/people/profile/${resource?.owner?.username}/`}> {(resource?.owner?.first_name !== "" && resource?.owner?.last_name !== "" ) ? (resource?.owner?.first_name + " " + resource?.owner?.last_name) : resource?.owner?.username} </a>
        },
        {
            "label": "Created",
            "value": validateDataType(resource?.created) && moment(resource?.created).format('MMMM Do YYYY')
        },
        {
            "label": "Published",
            "value": validateDataType(resource?.date) && moment(resource?.date).format('MMMM Do YYYY')
        },
        {
            "label": "Last Modified",
            "value": validateDataType(resource?.last_updated) && moment(resource?.last_updated).format('MMMM Do YYYY')
        },
        {
            "label": "Resource Type",
            "value": validateDataType(resource?.resource_type) && <a href={formatHref({
                pathname: '/search/filter/',
                query: {
                    'f': resource?.resource_type
                }
            })}>{resource?.resource_type}</a>
        },
        {
            "label": "Category",
            "value": validateDataType(resource.category?.identifier) && <a href={formatHref({
                pathname: '/search/filter/',
                query: {
                    'filter{category.identifier.in}': resource.category?.identifier
                }
            })}>{resource.category?.identifier}</a>
        },
        {
            "label": "Keywords",
            "value": validateDataType(resource?.keywords) && resource?.keywords?.map((map) => {
                return (<a href={formatHref({
                    pathname: '/search/filter/',
                    query: {
                        'filter{keywords.slug.in}': map.slug
                    }
                })}>{map.name + " "}</a>);
            })
        },
        {
            "label": "Regions",
            "value": validateDataType(resource?.regions) && resource?.regions?.map((map) => {
                return (<a href={formatHref({
                    pathname: '/search/filter/',
                    query: {
                        'filter{regions.name.in}': map.name
                    }
                })}>{map.name + " "}</a>);
            })
        }
    ];


    const extraItemsList = [
        {
            "label": "Point of Contact",
            "value": <a href={`/messages/create/${resource?.poc?.pk}/`}> {(resource?.poc?.first_name !== "" && resource?.poc?.last_name !== "" ) ? (resource?.poc?.first_name + " " + resource?.poc?.last_name) : resource?.poc?.username} </a>
        },
        {
            "label": "License",
            "value": validateDataType(resource?.license?.name_long)
        },
        {
            "label": "Attribution",
            "value": validateDataType(resource?.attribution)
        },
        {
            "label": "Restriction",
            "value": validateDataType(resource?.restriction_code_type?.identifier)
        },
        {
            "label": "Edition",
            "value": validateDataType(resource?.edition)
        },
        {
            "label": "Maintenance Frequency",
            "value": validateDataType(resource?.maintenance_frequency)
        },
        {
            "label": "Language",
            "value": validateDataType(resource?.language)
        },
        {
            "label": "Purpose",
            "value": validateDataType(resource?.raw_purpose)
        },
        {
            "label": "Data Quality",
            "value": validateDataType(resource?.raw_data_quality_statement)
        },
        {
            "label": "Temporal extent",
            "value": (resource?.temporal_extent_start) ? resource?.temporal_extent_start + " - " : undefined  + (resource?.temporal_extent_end) ? resource?.temporal_extent_end : undefined
        },
        {
            "label": "Spatial Representation Type",
            "value": validateDataType(resource?.spatial_representation_type?.identifier)
        },
        {
            "label": "Supplemental Information",
            "value": validateDataType(resource?.raw_supplemental_information)
        }
    ];


    const itemsTab = [
        {
            title: <Message msgId={"gnviewer.info"} />,
            data: <DefinitionListMoreItem itemslist={infoField} extraItemsList={extraItemsList} />
        }

    ];

    const tableHead = [{
        key: "attribute",
        value: <Message msgId={"gnviewer.attributeName"} />
    },
    {
        key: "attribute_label",
        value: <Message msgId={"gnviewer.label"} />
    },
    {
        key: "description",
        value: <Message msgId={"gnviewer.description"} />
    }];

    (attributeSet) ? itemsTab.push({
        title: <Message msgId={"gnviewer.attributes"} />,
        data: <Table head={tableHead} body={attributeSet} />
    }) : undefined;

    return (
        <div
            ref={detailsContainerNode}
            className={`gn-details-panel${loading ? ' loading' : ''}`}
            style={{ width: sectionStyle?.width }}
        >
            <section style={sectionStyle}>
                {<div className="gn-details-panel-header">
                    <Button
                        variant="default"
                        href={linkHref()}
                        onClick={closePanel}
                        size="sm">
                        <FaIcon name="times" />
                    </Button>
                </div>
                }
                {resourceCanPreviewed && !activeEditMode && !editThumbnail && <div className="gn-details-panel-preview">
                    <div
                        className="gn-loader-placeholder"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                        <FaIcon name={icon} />
                    </div>
                    {embedUrl
                        ? <iframe
                            key={embedUrl}
                            src={embedUrl}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%'
                            }}
                            frameBorder="0"
                        />
                        : (!embedUrl && !editThumbnail ? (<ThumbnailPreview
                            src={resource?.thumbnail_url}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                top: 0,
                                left: 0,
                                backgroundColor: 'inherit'
                            }} />)
                            : undefined )
                    }
                    {loading && <div
                        className="gn-details-panel-preview-loader"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            top: 0,
                            left: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                        <Spinner animation="border" role="status">
                            <span className="sr-only">Loading resource detail...</span>
                        </Spinner>
                    </div>}
                </div>}

                <div className="gn-details-panel-content">
                    {editThumbnail && <div className="gn-details-panel-content-img">
                        {!activeEditMode && <ThumbnailPreview src={resource?.thumbnail_url} />}
                        {activeEditMode && <div className="gn-details-panel-preview inediting">
                            <EditThumbnail
                                onEdit={editThumbnail}
                                image={resource?.thumbnail_url}
                            />
                            { buttonSaveThumbnailMap }
                        </div>}
                    </div>
                    }


                    <div className="gn-details-panel-content-text">
                        <div className="gn-details-panel-title" >
                            <span className="gn-details-panel-title-icon" ><FaIcon name={icon} /> </span> <EditTitle disabled={!activeEditMode} tagName="h1"  title={resource?.title} onEdit={editTitle} >

                            </EditTitle>

                            {
                                <div className="gn-details-panel-tools">
                                    {
                                        enableFavorite &&
                                    <Button
                                        variant="default"
                                        onClick={debounce(handleFavorite, 500)}>
                                        <FaIcon name={favorite ? 'star' : 'star-o'} />
                                    </Button>
                                    }
                                    {documentDownloadUrl &&
                                    <Button variant="default"
                                        href={documentDownloadUrl} >
                                        <FaIcon name="download" />
                                    </Button>}

                                    {detailUrl && <CopyToClipboard
                                        tooltipPosition="top"
                                        tooltipId={
                                            copiedResourceLink
                                                ? 'gnhome.copiedResourceUrl'
                                                : 'gnhome.copyResourceUrl'
                                        }
                                        text={formatResourceLinkUrl(detailUrl)}
                                    >
                                        <Button
                                            variant="default"
                                            onClick={handleCopyPermalink}>
                                            <FaIcon name="share-alt" />
                                        </Button>
                                    </CopyToClipboard>
                                    }
                                    {detailUrl && !editThumbnail && <Button
                                        variant="default"
                                        href={(resourceCanPreviewed) ? detailUrl : metadataDetailUrl}
                                        rel="noopener noreferrer">
                                        <Message msgId={`gnhome.view${((resourceCanPreviewed) ? name : 'Metadata')}`} />
                                    </Button>}
                                </div>
                            }


                        </div>
                        <ResourceStatus resource={resource} />
                        {<p>
                            {resource?.owner && <><a href={formatHref({
                                pathname: editTitle && '/search/filter/',
                                query: {
                                    'filter{owner.username.in}': resource.owner.username
                                }
                            })}>{getUserName(resource.owner)}</a></>}
                            {(resource?.date_type && resource?.date)
                            && <>{' '}/{' '}{moment(resource.date).format('MMMM Do YYYY')}</>}
                        </p>
                        }

                        <EditAbstract disabled={!activeEditMode} tagName="span"  abstract={resource?.abstract} onEdit={editAbstract} />
                        <p>
                            {resource?.category?.identifier && <div>
                                <Message msgId="gnhome.category" />:{' '}
                                <a href={formatHref({
                                    pathname: editTitle && '/search/filter/',
                                    query: {
                                        'filter{category.identifier.in}': resource.category.identifier
                                    }
                                })}>{resource.category.identifier}</a>
                            </div>}
                        </p>
                    </div>
                </div>
                { editTitle && <div className="gn-details-panel-info"><Tabs itemsTab={itemsTab} /></div>}
            </section>
        </div>
    );
}

DetailsPanel.defaultProps = {
    onClose: () => { },
    formatHref: () => '#',
    linkHref: () => '#',
    width: 696,
    getTypesInfo: getResourceTypesInfo
};

export default DetailsPanel;
