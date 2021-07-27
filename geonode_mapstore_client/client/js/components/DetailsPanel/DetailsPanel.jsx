/* eslint-disable no-script-url */
/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Tabs from '@js/components/Tabs';
import DefinitionList from '@js/components/DefinitionList';
import Spinner from '@js/components/Spinner';
import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import moment from 'moment';
import {
    getUserName,
    getResourceTypesInfo
} from '@js/utils/GNSearchUtils';
import debounce from 'lodash/debounce';
import CopyToClipboardCmp from 'react-copy-to-clipboard';
import url from 'url';
import { TextEditable, ThumbnailEditable } from '@js/components/ContentsEditable/';

const CopyToClipboard = tooltip(CopyToClipboardCmp);

const EditTitle = ({ title, onEdit }) => {
    return (
        <div className="editContainer">
            <TextEditable onEdit={onEdit} text={title} />
        </div>);
};

const EditAbstract = ({ abstract, onEdit }) => (
    <div className="editContainer">
        <TextEditable onEdit={onEdit} text={abstract} />
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
    const { path } = url.parse(resourceUrl);
    const { protocol, host } = window.location;
    return `${protocol}://${host}${path}`;
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
    enableFavorite
}) {

    const [editModeTitle, setEditModeTitle] = useState(false);
    const [editModeAbstract, setEditModeAbstract] = useState(false);

    const handleEditModeTitle = () => {
        setEditModeTitle(!editModeTitle);
    };

    const handleEditModeAbstract = () => {
        setEditModeAbstract(!editModeAbstract);
    };

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
        icon,
        name
    } = resource && (types[resource.doc_type] || types[resource.resource_type]) || {};
    const embedUrl = resource?.embed_url && formatEmbedUrl(resource);
    const detailUrl = resource?.pk && formatDetailUrl(resource);
    const documentDownloadUrl = (resource?.href && resource?.href.includes('download')) ? resource?.href : undefined;

    const infoField = [
        {
            "label": "Title",
            "value": resource?.title
        },
        {
            "label": "Abstract",
            "value": resource?.raw_abstract
        },
        {
            "label": "Owner",
            "value": resource?.owner?.username
        },
        {
            "label": "Created",
            "value": moment(resource?.created).format('MMMM Do YYYY')
        },
        {
            "label": "Published",
            "value": moment(resource?.date).format('MMMM Do YYYY')
        },
        {
            "label": "Last Modified",
            "value": moment(resource?.last_updated).format('MMMM Do YYYY')
        },
        {
            "label": "Resource Type",
            "value": resource?.resource_type
        },
        {
            "label": "Category",
            "value": resource?.category
        },
        {
            "label": "Keywords",
            "value": resource?.keywords?.join(" ")
        },
        {
            "label": "Regions",
            "value": resource?.regions?.map(map => map.name + " ")
        }
    ];

    const extraItemsList = [
        {
            "label": "Point of Contact",
            "value": (resource?.poc?.first_name + resource?.poc?.last_name || resource?.poc?.username)
        },
        {
            "label": "License",
            "value": resource?.license?.name_long
        },
        {
            "label": "Attribution",
            "value": resource?.attribution
        },
        {
            "label": "Restriction",
            "value": resource?.restriction_code_type?.identifier
        },
        {
            "label": "Edition",
            "value": resource?.edition
        },
        {
            "label": "Maintenance Frequency",
            "value": resource?.maintenance_frequency
        },
        {
            "label": "Language",
            "value": resource?.language
        },
        {
            "label": "Purpose",
            "value": resource?.raw_purpose
        },
        {
            "label": "Data Quality",
            "value": resource?.raw_data_quality_statement
        },
        {
            "label": "Temporal extent",
            "value": (resource?.temporal_extent_start) ? resource?.temporal_extent_start + " - " : undefined  + (resource?.temporal_extent_end) ? resource?.temporal_extent_end : undefined
        },
        {
            "label": "Spatial Representation Type",
            "value": resource?.spatial_representation_type?.identifier
        },
        {
            "label": "Supplemental Information",
            "value": resource?.raw_supplemental_information
        }
    ];


    const itemsTab = [
        {
            title: "Info",
            data: <DefinitionListMoreItem itemslist={infoField} extraItemsList={extraItemsList} />
        }
    ];


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
                {!activeEditMode && !editThumbnail && <div className="gn-details-panel-preview">
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
                        {activeEditMode && <div className="gn-details-panel-preview inediting"> <EditThumbnail onEdit={editThumbnail} image={resource?.thumbnail_url} /> </div>}
                    </div>
                    }


                    <div className="gn-details-panel-content-text">
                        <div className="gn-details-panel-title" >

                            {!editModeTitle && <h1>
                                {icon && <><FaIcon name={icon} /></>}
                                {resource?.title}
                            </h1>
                            }
                            {activeEditMode && !editModeTitle && <span onClick={handleEditModeTitle} ><FaIcon name={'pencil-square-o'} /></span>}


                            {editModeTitle && <h1>
                                <EditTitle title={resource?.title} onEdit={editTitle} />
                                <span className="inEdit" onClick={handleEditModeTitle} ><FaIcon name={'check-circle'} /></span>
                            </h1>
                            }
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
                                        href={detailUrl}
                                        rel="noopener noreferrer">
                                        <Message msgId={`gnhome.view${name || ''}`} />
                                    </Button>}
                                </div>
                            }


                        </div>


                        {<p>
                            {resource?.owner && <><a href={formatHref({
                                query: {
                                    'filter{owner.username.in}': resource.owner.username
                                }
                            })}>{getUserName(resource.owner)}</a></>}
                            {(resource?.date_type && resource?.date)
                            && <>{' '}/{' '}{moment(resource.date).format('MMMM Do YYYY')}</>}
                        </p>
                        }
                        <div className="gn-details-panel-description">
                            {editModeAbstract && <>
                                <EditAbstract abstract={resource?.abstract} onEdit={editAbstract} />
                                <span className="inEdit" onClick={handleEditModeAbstract} ><FaIcon name={'check-circle'} /></span>

                            </>
                            }
                            {
                                !editModeAbstract && resource?.abstract ?
                                    <span className="gn-details-panel-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resource.abstract) }} />
                                    : null
                            }
                            {activeEditMode && !editModeAbstract && <span onClick={handleEditModeAbstract} ><FaIcon name={'pencil-square-o'} /></span>}
                        </div>

                        <p>
                            {resource?.category?.identifier && <div>
                                <Message msgId="gnhome.category" />:{' '}
                                <a href={formatHref({
                                    query: {
                                        'filter{category.identifier.in}': resource.category.identifier
                                    }
                                })}>{resource.category.identifier}</a>
                            </div>}
                        </p>

                    </div>
                </div>
                {editTitle && <div className="gn-details-panel-info"><Tabs itemsTab={itemsTab} /></div>}
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
