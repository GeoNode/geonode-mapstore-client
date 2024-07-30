import expect from 'expect';
import {
    determineResourceType,
    getFileNameAndExtensionFromUrl,
    getFileNameParts,
    getFilenameFromContentDispositionHeader
} from '@js/utils/FileUtils';

describe('FileUtils', () => {
    it('should return image if extension is a supported image format', () => {
        const mediaType = determineResourceType('jpg');
        expect(mediaType).toEqual('image');
    });

    it('should return video if extension is a supported video format', () => {
        const mediaType = determineResourceType('mp4');
        expect(mediaType).toEqual('video');
    });

    it('should return pdf if extension pdf', () => {
        const mediaType = determineResourceType('pdf');
        expect(mediaType).toEqual('pdf');
    });

    it('should return unsupported if extension is not supported', () => {
        const mediaType = determineResourceType('docx');
        expect(mediaType).toEqual('unsupported');
    });

    it('should return video if extension is a supported audio format', () => {
        const mediaType = determineResourceType('mp3');
        expect(mediaType).toEqual('video');
    });

    it('should always return file extension in lowercase', () => {
        const file = {
            name: 'test file.ZIP'
        };
        expect(getFileNameParts(file).ext).toBe('zip');
    });

    describe('getFileNameAndExtensionFromUrl', () => {
        it('test with valid url with extension', () => {
            const {fileName, ext} = getFileNameAndExtensionFromUrl("http://localhost/test.jpg");
            expect(ext).toBe('.jpg');
            expect(fileName).toBe('test');
        });
        it('test with url with no extension', () => {
            const {fileName, ext} = getFileNameAndExtensionFromUrl("http://localhost/test");
            expect(ext).toBe('');
            expect(fileName).toBe('test');
        });
        it('test with relative path url', () => {
            const {fileName, ext} = getFileNameAndExtensionFromUrl("/test/file.pdf");
            expect(ext).toBe('.pdf');
            expect(fileName).toBe('file');
        });
        it('test with url with extension with filename having multiple delimiters', () => {
            const {fileName, ext} = getFileNameAndExtensionFromUrl("http://localhost/test.ss.hh.png");
            expect(ext).toBe('.png');
            expect(fileName).toBe('test.ss.hh');
        });
        it('test with invalid url', () => {
            const {fileName, ext} = getFileNameAndExtensionFromUrl();
            expect(ext).toBe('');
            expect(fileName).toBe('');
        });
    });
    it('getFilenameFromContentDispositionHeader', () => {
        expect(getFilenameFromContentDispositionHeader()).toBe('');
        expect(getFilenameFromContentDispositionHeader('attachment; filename="tileset.json"')).toBe('tileset.json');
        expect(getFilenameFromContentDispositionHeader('attachment; filename*="filename.jpg"')).toBe('filename.jpg');
        expect(getFilenameFromContentDispositionHeader('attachment')).toBe('');
    });
});

