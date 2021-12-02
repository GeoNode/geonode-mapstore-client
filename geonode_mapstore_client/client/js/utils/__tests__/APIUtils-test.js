import expect from 'expect';
import { parseDevHostname } from '@js/utils/APIUtils';

describe('APIUtils', () => {
    beforeEach(done => {
        window.__DEVTOOLS__ = true;
        setTimeout(done);
    });

    afterEach(done => {
        delete window.__DEVTOOLS__;
        setTimeout(done);
    });
    it('should remove localhost hostname', () => {
        expect(parseDevHostname('http://localhost:8081/path')).toBe('/path');
    });
    it('should keep the url if the hostname is not localhost', () => {
        expect(parseDevHostname('https://hostname/path')).toBe('https://hostname/path');
    });
});
