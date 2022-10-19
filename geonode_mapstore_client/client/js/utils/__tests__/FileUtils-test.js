import expect from 'expect';
import { determineResourceType, getFileNameParts } from '@js/utils/FileUtils';

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

    it('should always return file extension in lowercase', () => {
        const file = {
            name: 'test file.ZIP'
        };
        expect(getFileNameParts(file).ext).toBe('zip');
    });
});

