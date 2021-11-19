import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import Media from '@js/components/MediaViewer/Media';

describe('Test Media', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should render by default', () => {
        ReactDOM.render( <Media resource={{href: "http://example.com", resource_type: "document", extension: "jpeg", "abstract": "test", pk: 1, perms: [
            "download_resourcebase"] }}/>, document.getElementById("container"));
        const mediaViewer = document.querySelector('.ms-media');
        expect(mediaViewer).toExist();
    });

    it('should render video player if resource extension is video', () => {
        ReactDOM.render( <Media resource={{href: "http://example.com", resource_type: "document", extension: "mp4", "abstract": "test", pk: 1, perms: [
            "download_resourcebase"
        ] }}/>, document.getElementById("container"));
        const mediaViewer = document.querySelector('.ms-video');
        expect(mediaViewer).toExist();
    });

    it('should render pdf viewer if resource extension is pdf', () => {
        ReactDOM.render( <Media resource={{href: "http://example.com", resource_type: "document", extension: "pdf", "abstract": "test", pk: 1, perms: [
            "download_resourcebase"
        ] }}/>, document.getElementById("container"));
        const mediaViewer = document.querySelector('.gn-pdf-viewer');
        expect(mediaViewer).toExist();
    });

    it('should render caption viewer if resource extension is unSupported', () => {
        ReactDOM.render( <Media resource={{href: "http://example.com", resource_type: "document", extension: "docx", "abstract": "test", pk: 1, perms: [
            "download_resourcebase"
        ] }}/>, document.getElementById("container"));
        const mediaViewer = document.querySelector('.ms-media'); // unSupported Media is shown in ImageViewer
        expect(mediaViewer).toExist();
        const unSupportedCaptions = document.querySelector('.unsupported-media-caption');
        expect(unSupportedCaptions).toExist();
    });

    it('should render error message if resource has not download perms', () => {
        ReactDOM.render( <Media resource={{href: "http://example.com", resource_type: "document", extension: "jpeg", "abstract": "test", pk: 1 }}/>, document.getElementById("container"));
        const ErrorMess = document.querySelector('.gn-main-event-text');
        expect(ErrorMess).toExist();
    });

});
