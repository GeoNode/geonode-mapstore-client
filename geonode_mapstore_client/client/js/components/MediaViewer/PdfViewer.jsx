import React, { useState, useEffect } from 'react';
import Loader from '@mapstore/framework/components/misc/Loader';
import { getFileFromDownload } from '@js/utils/FileUtils';
import MetadataPreview from '@js/components/MetadataPreview';

const IframePDF = ({ src }) => {
    return (
        <iframe
            className="gn-pdf-viewer"
            type="application/pdf"
            frameBorder="0"
            scrolling="auto"
            height="100%"
            width="100%" src={src}
        />
    );
};

const AsyncIframePDF = ({ src, url }) => {
    const [filePath, setFilePath] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        getFileFromDownload(src)
            .then((fileURL) => {
                setFilePath(fileURL);
            })
            .catch(() => {
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (<div
            className="pdf-loader">
            <Loader size={70}/>
        </div>);
    }

    if (error) {
        return (
            <MetadataPreview url={url}/>
        );
    }

    return filePath ? (<IframePDF src={filePath}/>) : <div className="gn-pdf-viewer" />;
};

const PdfViewer = ({ src, url }) => {
    return <AsyncIframePDF src={src} url={url} />;
};

export default PdfViewer;
