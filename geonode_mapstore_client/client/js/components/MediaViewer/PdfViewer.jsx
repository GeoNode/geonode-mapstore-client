import React, { useState, useEffect } from 'react';
import Loader from '@mapstore/framework/components/misc/Loader';
import { getFileFromDownload } from '@js/utils/FileUtils';

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

const AsyncIframePDF = ({ src }) => {
    const [filePath, setFilePath] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getFileFromDownload(src)
            .then((fileURL) => {
                setLoading(false);
                setFilePath(fileURL);
            }).finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (<div
            className="pdf-loader">
            <Loader size={70}/>
        </div>);
    }

    return (<IframePDF src={filePath}/>);
};

const PdfViewer = ({ src, isExternalSource }) => {
    const Viewer = isExternalSource ? IframePDF : AsyncIframePDF;
    return <Viewer src={src} />;
};

export default PdfViewer;
