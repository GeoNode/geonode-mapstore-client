/* eslint-disable no-script-url */
/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Glyphicon } from 'react-bootstrap';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Tabs from '@js/components/Tabs';
import DefinitionList from '@js/components/DefinitionList';
import Spinner from '@js/components/Spinner';
import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import moment from 'moment';
import { getResourceTypesInfo, getMetadataDetailUrl, ResourceTypes, GXP_PTYPES } from '@js/utils/ResourceUtils';
import debounce from 'lodash/debounce';
import CopyToClipboardCmp from 'react-copy-to-clipboard';
import { TextEditable, ThumbnailEditable } from '@js/components/ContentsEditable/';
import ResourceStatus from '@js/components/ResourceStatus/';
import BaseMap from '@mapstore/framework/components/map/BaseMap';
import mapTypeHOC from '@mapstore/framework/components/map/enhancers/mapType';
import AuthorInfo from '@js/components/AuthorInfo/AuthorInfo';
import Loader from '@mapstore/framework/components/misc/Loader';
import { getUserName } from '@js/utils/SearchUtils';
import ZoomTo from '@js/components/ZoomTo';
import { boundsToExtentString } from '@js/utils/CoordinatesUtils';

const Map = mapTypeHOC(BaseMap);
Map.displayName = 'Map';

const MapThumbnailButtonToolTip = tooltip(Button);
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


const EditThumbnail = ({ image, onEdit, thumbnailUpdating }) => (
    <div className="editContainer imagepreview">
        <ThumbnailEditable onEdit={onEdit} defaultImage={image} />
        {thumbnailUpdating && <div className="gn-details-thumbnail-loader">
            <Loader size={50} />
        </div>
        }
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


const DefinitionListContainer = ({itemslist}) => {

    return (
        <div className="DList-containner">
            <DefinitionList itemslist={itemslist} />
        </div>


    );
};

const MapThumbnailView = ({ initialBbox, layers, onMapThumbnail, onClose, savingThumbnailMap } ) => {

    const [currentBbox, setCurrentBbox] = useState();
    const { bounds, crs } = initialBbox;
    const extent = boundsToExtentString(bounds, crs);

    function handleOnMapViewChanges(center, zoom, bbox) {
        setCurrentBbox(bbox);
    }

    return (
        <div>
            <div
                className="gn-detail-extent"
            >
                <Map
                    id="gn-filter-by-extent-map"
                    mapType="openlayers"
                    map={{
                        registerHooks: false,
                        projection: 'EPSG:3857' // to use parameter projection
                    }}
                    styleMap={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%'
                    }}
                    eventHandlers={{
                        onMapViewChanges: handleOnMapViewChanges
                    }}
                    layers={[
                        ...(layers ? layers : [])
                    ]}
                >
                    <ZoomTo extent={extent} />
                </Map>
                {savingThumbnailMap && <div className="gn-details-thumbnail-loader">
                    <Loader size={50} />
                </div>
                }
            </div>
            <div className="gn-detail-extent-action">
                <Button className="btn-primary" onClick={() => onMapThumbnail(currentBbox)} ><Message msgId={"gnhome.apply"} /></Button><Button onClick={() => onClose(false) }><i className="fa fa-close"/></Button></div>
        </div>
    );

};


const extractResourceString = (res) => {
    const resourceFirstLetter = res?.charAt(0).toUpperCase();
    const restOfResourceLetters = res?.slice(1);
    const resourceTypeString = resourceFirstLetter + restOfResourceLetters;
    return resourceTypeString;

};

function DetailsPanel({
    resource,
    formatHref,
    linkHref,
    sectionStyle,
    loading,
    downloading,
    getTypesInfo,
    editTitle,
    editAbstract,
    editThumbnail,
    activeEditMode,
    closePanel,
    favorite,
    onFavorite,
    enableFavorite,
    onMapThumbnail,
    savingThumbnailMap,
    layers,
    isThumbnailChanged,
    onResourceThumbnail,
    resourceThumbnailUpdating,
    initialBbox,
    enableMapViewer,
    onClose,
    onAction,
    canDownload,
    onUpdateFavorite
}) {
    const detailsContainerNode = useRef();
    const isMounted = useRef();
    const [copiedResourceLink, setCopiedResourceLink] = useState(false);
    const [readMore, setReadMore] = useState(false);

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

    const handleFavorite = (fav) => {
        fav ? onUpdateFavorite({
            'favorite': false
        })
            : onUpdateFavorite({
                'favorite': true
            });
        onFavorite(!fav);
    };

    const handleResourceThumbnailUpdate = () => {
        onResourceThumbnail();
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
    const downloadUrl = (resource?.href && resource?.href.includes('download')) ? resource?.href
        : (resource?.download_url && canDownload) ? resource?.download_url : undefined;
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

    // To be used when user clicks 'Read more' for long abstracts
    const extraContent = readMore && (<span className="extra-content">
        {validateDataType(resource?.raw_abstract)?.substring(100, resource?.raw_abstract?.length - 1)}
    </span>);

    const linkName = readMore ? 'Read Less' : 'Read More';

    const infoField = [
        {
            "label": "Title",
            "value": validateDataType(resource?.title)
        },
        {
            "label": "Abstract",
            "value": validateDataType(resource?.raw_abstract)?.length > 100 ? <div>{validateDataType(resource?.raw_abstract)?.substring(0, 100)}{extraContent}{' '}<a className="read-more-link" onClick={() => setReadMore(!readMore) }>{linkName}</a></div> : validateDataType(resource?.raw_abstract)
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
            data: <DefinitionListContainer itemslist={[...infoField, ...extraItemsList]} />
        }

    ];

    const ResourceMessage = ({ type }) => {
        return (<span className="gn-details-panel-origin">
            <Message msgId="gnviewer.resourceOrigin.a" />{' '}<a href={formatHref({
                query: {
                    'filter{resource_type.in}': type
                }
            })} title="Search all similar resources">{type || 'resource'}</a>{' '}<Message msgId="gnviewer.resourceOrigin.from" />{' '}
        </span>);
    };

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
                        className="square-button">
                        <Glyphicon glyph="1-close" />
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
                            {!enableMapViewer ? <> <EditThumbnail
                                onEdit={editThumbnail}
                                image={resource?.thumbnail_url}
                                thumbnailUpdating={resourceThumbnailUpdating}
                            />
                            {
                                ((resource.resource_type === ResourceTypes.MAP || resource.resource_type === ResourceTypes.DATASET) && (resource.ptype !== GXP_PTYPES.REST_IMG || resource.ptype !== GXP_PTYPES.REST_MAP)) &&
                                ( <><MapThumbnailButtonToolTip
                                    variant="default"
                                    onClick={() => onClose(!enableMapViewer)}
                                    className="map-thumbnail"
                                    tooltip={<Message msgId="gnviewer.saveMapThumbnail" />}
                                    tooltipPosition={"top"}
                                >
                                    <FaIcon name="map" />
                                </MapThumbnailButtonToolTip>
                                </>)
                            }
                            {isThumbnailChanged && <Button style={{
                                left: ((resource.resource_type === ResourceTypes.MAP || resource.resource_type === ResourceTypes.DATASET) && (resource.ptype !== GXP_PTYPES.REST_IMG || resource.ptype !== GXP_PTYPES.REST_MAP)) ? '85px' : '50px'
                            }} variant="primary" className="map-thumbnail apply-button" onClick={handleResourceThumbnailUpdate}><Message msgId={"gnhome.apply"} /></Button>}
                            </>
                                : <MapThumbnailView
                                    layers={layers}
                                    onMapThumbnail={onMapThumbnail}
                                    onClose={onClose}
                                    savingThumbnailMap={savingThumbnailMap}
                                    initialBbox={initialBbox}
                                />
                            }
                        </div>}
                    </div>
                    }


                    <div className="gn-details-panel-content-text">
                        <div className="gn-details-panel-title" >
                            <span className="gn-details-panel-title-icon" >{!downloading ? <FaIcon name={icon} /> : <Spinner />} </span> <EditTitle disabled={!activeEditMode} tagName="h1"  title={resource?.title} onEdit={editTitle} >

                            </EditTitle>

                            {
                                <div className="gn-details-panel-tools">
                                    <ResourceStatus resource={resource} />
                                    {
                                        enableFavorite &&
                                    <Button
                                        variant="default"
                                        onClick={debounce(() => handleFavorite(favorite), 500)}>
                                        <FaIcon name={favorite ? 'star' : 'star-o'} />
                                    </Button>
                                    }
                                    {downloadUrl &&
                                    <Button variant="default"
                                        onClick={() => onAction(resource)} >
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
                                        variant="primary"
                                        href={(resourceCanPreviewed) ? detailUrl : metadataDetailUrl}
                                        rel="noopener noreferrer">
                                        <Message msgId={`gnhome.view${((resourceCanPreviewed) ? name : 'Metadata')}`} />
                                    </Button>}
                                </div>
                            }


                        </div>
                        {<p className="gn-details-panel-meta-text">
                            {resource?.owner &&  <>{resource?.owner.avatar &&
                            <img src={resource?.owner.avatar} alt={getUserName(resource?.owner)} className="gn-card-author-image" />
                            }
                            <ResourceMessage type={resource?.resource_type} />
                            <AuthorInfo resource={resource} formatHref={formatHref} style={{ margin: 0 }} detailsPanel /></>}
                            {(resource?.date_type && resource?.date)
                            && <>{' '}/{' '}{moment(resource.date).format('MMMM Do YYYY')}</>}
                        </p>
                        }

                        <EditAbstract disabled tagName="span" abstract={resource?.abstract} onEdit={editAbstract} />
                        <p>
                            {resource?.category?.identifier && <div>
                                <Message msgId="gnhome.category" />:{' '}
                                <a href={formatHref({
                                    pathname: editTitle && '/search/filter/',
                                    query: {
                                        'filter{category.identifier.in}': resource.category.identifier
                                    }
                                })}>{extractResourceString(resource.category.identifier)}</a>
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
    onResourceThumbnail: () => '#',
    width: 696,
    getTypesInfo: getResourceTypesInfo,
    isThumbnailChanged: false,
    onAction: () => {}
};

export default DetailsPanel;
