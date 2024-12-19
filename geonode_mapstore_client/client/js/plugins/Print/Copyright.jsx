/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from "react";
import { connect } from "react-redux";
import get from "lodash/get";

import { createPlugin } from "@mapstore/framework/utils/PluginsUtils";
import { setPrintParameter } from "@mapstore/framework/actions/print";
import printReducer from "@mapstore/framework/reducers/print";
import { TextInput } from "@mapstore/framework/plugins/print/TextInput";
import { addTransformer } from "@mapstore/framework/utils/PrintUtils";

const copyrightTransformer = (state, spec) => {
    return Promise.resolve({
        ...spec,
        copyright: get(state, "print.spec.copyright", "")
    });
};

const Copyright = (props) => {
    useEffect(() => {
        addTransformer("copyright", copyrightTransformer, 7);
    }, []);
    return <TextInput {...props} />;
};

export default createPlugin("PrintCopyright", {
    component: connect(
        (state) => ({
            spec: state.print?.spec || {},
            additionalProperty: false,
            property: "copyright",
            path: "",
            label: "viewer.print.copyright",
            placeholder: "viewer.print.copyrightPlaceholder"
        }),
        {
            onChangeParameter: setPrintParameter
        }
    )(Copyright),
    reducers: { print: printReducer },
    containers: {
        Print: {
            priority: 1,
            target: "left-panel",
            position: 7
        }
    }
});
