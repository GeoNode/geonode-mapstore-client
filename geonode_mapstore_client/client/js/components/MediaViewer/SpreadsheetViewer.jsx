/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from "react";

import AdaptiveGrid from "@mapstore/framework/components/misc/AdaptiveGrid";
import Loader from "@mapstore/framework/components/misc/Loader";
import Message from "@mapstore/framework/components/I18N/Message";

import MetadataPreview from "@js/components/MetadataPreview/MetadataPreview";
import { parseCSVToArray } from "@js/utils/FileUtils";


const VirtualizedGrid = ({data}) => {
    let [columns, ...rows] = data ?? [];
    columns = columns?.map((column, index) => ({key: index, name: column})) ?? [];

    const rowGetter = rowNumber => rows?.[rowNumber];

    return (
        <div className="grid-container">
            <AdaptiveGrid
                columns={columns}
                rowGetter={rowGetter}
                rowsCount={rows?.length ?? 0}
                emptyRowsView={() => <span className="empty-data"><Message msgId="gnviewer.noGridData"/></span>}
                minColumnWidth={100}
            />
        </div>
    );
};

export const SpreadsheetViewer = ({extension, title, description, src, url}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (src) {
            setLoading(true);
            fetch(src)
                .then(response => extension === "csv"
                    ? response.text()
                    : response.arrayBuffer()
                )
                .then((res) => {
                    let response = res;
                    if (extension !== "csv") {
                        import('xlsx').then(({ read, utils }) => {
                            const workbook = read(response, { type: "array" });

                            // Convert first sheet to CSV
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            response = utils.sheet_to_csv(worksheet);
                            setData(parseCSVToArray(response));
                        }).catch((e) => {
                            console.error("Failed to load xlsx module", e);
                        });
                    } else {
                        setData(parseCSVToArray(response));
                    }
                }).catch(() => {
                    setError(true);
                }).finally(()=> {
                    setLoading(false);
                });
        }
    }, [src]);

    if (loading) {
        return (
            <div className="csv-loader">
                <Loader size={70}/>
            </div>
        );
    }

    if (error) {
        return (
            <MetadataPreview url={url}/>
        );
    }

    return data?.length > 0 ? (
        <div className="gn-csv-viewer">
            <div className="csv-container">
                <span className="title">{title}</span>
                <span className="description">{description}</span>
                <VirtualizedGrid data={data}/>
            </div>
        </div>
    ) : null;
};

export default SpreadsheetViewer;
