/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@mapstore/framework/components/layout/Button';
import { Glyphicon } from 'react-bootstrap';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import DescriptionFieldTemplate from './DescriptionFieldTemplate';
import FieldTemplate from './FieldTemplate';
import TitleFieldTemplate from './TitleFieldTemplate';

function AddButton({
    onClick,
    disabled
}) {
    return (
        <Button
            disabled={disabled}
            className="square-button-md"
            onClick={onClick}
            variant="primary"
        >
            <Glyphicon glyph="plus" />
        </Button>
    );
}

function MoveUpButton({
    onClick,
    disabled
}) {
    return (
        <Button
            disabled={disabled}
            className="square-button-md"
            onClick={onClick}
            style={ disabled ? { visibility: 'hidden' } : {}}
        >
            <Glyphicon glyph="arrow-up" />
        </Button>
    );
}

function MoveDownButton({
    onClick,
    disabled
}) {
    return (
        <Button
            disabled={disabled}
            className="square-button-md"
            onClick={onClick}
            style={ disabled ? { visibility: 'hidden' } : {}}
        >
            <Glyphicon glyph="arrow-down" />
        </Button>
    );
}

function RemoveButton({
    onClick,
    disabled
}) {
    return (
        <Button
            disabled={disabled}
            className="square-button-md"
            onClick={onClick}
        >
            <Glyphicon glyph="trash" />
        </Button>
    );
}


export default {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate,
    DescriptionFieldTemplate,
    ErrorListTemplate: () => null,
    FieldTemplate,
    ButtonTemplates: {
        AddButton,
        MoveUpButton,
        MoveDownButton,
        RemoveButton
    }
};
