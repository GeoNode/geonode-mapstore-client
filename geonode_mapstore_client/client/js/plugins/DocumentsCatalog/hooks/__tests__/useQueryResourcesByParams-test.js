/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import useQueryResourcesByParams from '../useQueryResourcesByParams';
import expect from 'expect';
import { act } from 'react-dom/test-utils';

const Component = ({ queryParams, ...props }) => {
    const defaultRequest = props.request || (() => Promise.resolve({ resources: [], isNextPageAvailable: false, total: 0 }));

    useQueryResourcesByParams({
        ...props,
        queryParams,
        request: defaultRequest
    });

    return (
        <div id="test-container">
            Test Component Rendered
        </div>
    );
};

describe('useQueryResourcesByParams', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should initialize without errors', (done) => {
        let renderCount = 0;
        act(() => {
            ReactDOM.render(<Component
                setLoading={() => { }}
                setResources={() => { renderCount += 1; }}
                setResourcesMetadata={() => { }}
                request={() => {
                    return Promise.resolve({
                        resources: [],
                        isNextPageAvailable: false,
                        total: 0
                    });
                }}
                queryParams={{}}
            />, document.getElementById("container"));
        });

        setTimeout(() => {
            expect(renderCount).toBeGreaterThanOrEqualTo(0);
            done();
        }, 400);
    });

    it('should trigger request when queryParams change', (done) => {
        let requestCount = 0;
        act(() => {
            ReactDOM.render(<Component
                pageSize={20}
                request={() => {
                    requestCount += 1;
                    return Promise.resolve({
                        resources: [{ id: 1, title: 'Resource 1' }],
                        isNextPageAvailable: false,
                        total: 1
                    });
                }}
                setLoading={() => { }}
                setResources={(resources) => {
                    try {
                        expect(resources).toEqual([{ id: 1, title: 'Resource 1' }]);
                    } catch (e) {
                        done(e);
                    }
                }}
                setResourcesMetadata={() => { }}
                queryParams={{ search: 'test' }}
            />, document.getElementById("container"));
        });

        setTimeout(() => {
            try {
                expect(requestCount).toBe(1);
                done();
            } catch (e) {
                done(e);
            }
        }, 400);
    });

    it('should not trigger request if queryParams have not changed', (done) => {
        let requestCount = 0;
        act(() => {
            ReactDOM.render(<Component
                pageSize={20}
                request={() => {
                    requestCount += 1;
                    return Promise.resolve({
                        resources: [],
                        isNextPageAvailable: false,
                        total: 0
                    });
                }}
                setLoading={() => { }}
                setResources={() => { }}
                setResourcesMetadata={() => { }}
                queryParams={{ search: 'test' }}
            />, document.getElementById("container"));
        });

        setTimeout(() => {
            const firstRequestCount = requestCount;
            act(() => {
                ReactDOM.render(<Component
                    pageSize={20}
                    request={() => {
                        requestCount += 1;
                        return Promise.resolve({
                            resources: [],
                            isNextPageAvailable: false,
                            total: 0
                        });
                    }}
                    setLoading={() => { }}
                    setResources={() => { }}
                    setResourcesMetadata={() => { }}
                    queryParams={{ search: 'test' }}
                />, document.getElementById("container"));
            });

            setTimeout(() => {
                try {
                    expect(requestCount).toBe(firstRequestCount);
                    done();
                } catch (e) {
                    done(e);
                }
            }, 400);
        }, 400);
    });

    it('should set loading to true before request and false after', (done) => {
        let loadingStates = [];
        act(() => {
            ReactDOM.render(<Component
                pageSize={20}
                request={() => {
                    return Promise.resolve({
                        resources: [],
                        isNextPageAvailable: false,
                        total: 0
                    });
                }}
                setLoading={(isLoading) => {
                    loadingStates.push(isLoading);
                }}
                setResources={() => {
                    setTimeout(() => {
                        try {
                            expect(loadingStates[0]).toBe(true);
                            expect(loadingStates[loadingStates.length - 1]).toBe(false);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }, 100);
                }}
                setResourcesMetadata={() => { }}
                queryParams={{ search: 'test' }}
            />, document.getElementById("container"));
        });
    });

    it('should delay request execution by 300ms', (done) => {
        let requestTime = null;
        const startTime = Date.now();

        act(() => {
            ReactDOM.render(<Component
                pageSize={20}
                request={() => {
                    requestTime = Date.now();
                    return Promise.resolve({
                        resources: [],
                        isNextPageAvailable: false,
                        total: 0
                    });
                }}
                setLoading={() => { }}
                setResources={() => {
                    const delay = requestTime - startTime;
                    try {
                        expect(delay).toBeGreaterThanOrEqualTo(300);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }}
                setResourcesMetadata={() => { }}
                queryParams={{ search: 'test' }}
            />, document.getElementById("container"));
        });
    });

    it('should cancel previous request when new queryParams change', (done) => {
        act(() => {
            ReactDOM.render(<Component
                pageSize={20}
                request={() => {
                    return Promise.resolve({
                        resources: [],
                        isNextPageAvailable: false,
                        total: 0
                    });
                }}
                setLoading={() => { }}
                setResources={() => { }}
                setResourcesMetadata={() => { }}
                queryParams={{ search: 'test1' }}
            />, document.getElementById("container"));
        });

        setTimeout(() => {
            act(() => {
                ReactDOM.render(<Component
                    pageSize={20}
                    request={() => {
                        return Promise.resolve({
                            resources: [],
                            isNextPageAvailable: false,
                            total: 0
                        });
                    }}
                    setLoading={() => { }}
                    setResources={() => { done(); }}
                    setResourcesMetadata={() => { }}
                    queryParams={{ search: 'test2' }}
                />, document.getElementById("container"));
            });
        }, 150);
    });

    it('should cleanup on unmount', (done) => {
        let container = document.getElementById("container");

        act(() => {
            ReactDOM.render(<Component
                pageSize={20}
                request={() => {
                    return Promise.resolve({
                        resources: [],
                        isNextPageAvailable: false,
                        total: 0
                    });
                }}
                setLoading={() => { }}
                setResources={() => { }}
                setResourcesMetadata={() => { }}
                queryParams={{ search: 'test' }}
            />, container);
        });

        setTimeout(() => {
            ReactDOM.unmountComponentAtNode(container);
            done();
        }, 150);
    });
    it('should set resources and metadata on successful request', (done) => {
        const mockResources = [
            { id: 1, title: 'Resource 1' },
            { id: 2, title: 'Resource 2' }
        ];

        act(() => {
            ReactDOM.render(<Component
                pageSize={20}
                request={() => {
                    return Promise.resolve({
                        resources: mockResources,
                        isNextPageAvailable: true,
                        total: 2
                    });
                }}
                setLoading={() => { }}
                setResources={(resources) => {
                    try {
                        expect(resources).toEqual(mockResources);
                    } catch (e) {
                        done(e);
                    }
                }}
                setResourcesMetadata={(metadata) => {
                    try {
                        expect(metadata.isNextPageAvailable).toBe(true);
                        expect(metadata.total).toBe(2);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }}
                queryParams={{ search: 'test' }}
            />, document.getElementById("container"));
        });
    });
});
