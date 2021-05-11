

/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useMemo } from 'react';
import tinycolor from 'tinycolor2';

function rootVariables(variables) {
    return ':root {\n' +
    Object.keys(variables)
        .filter(key => variables[key])
        .map((key) => `\t${key}: ${variables[key]};`).join('\n') +
    '\n}';
}

function RootStyle({
    theme
}) {

    const variables = useMemo(() => {
        if (theme) {
            const {
                color: themeColor,
                body,
                bodyShade,
                placeholder,
                disabled,
                danger,
                primary,
                link,
                image,
                jumbotron,
                focus,
                tag,
                badge,
                footer
            } = theme;
            const color = themeColor && tinycolor.mostReadable(themeColor, ['#ffffff', '#000000'], {
                includeFallbackColors: true
            }).toHexString();
            return {
                ...(themeColor && {
                    '--gn-primary-color': color,
                    '--gn-primary-bg': themeColor
                }),
                ...(body && {
                    '--gn-body-color': body.color || '#000000',
                    '--gn-body-bg': body.bg || '#ffffff',
                    '--gn-body-border-color': body.borderColor || '#dddddd'
                }),
                ...(bodyShade && {
                    '--gn-body-shade-color': bodyShade.color || '#000000',
                    '--gn-body-shade-bg': bodyShade.bg || '#f2f0f0'
                }),
                ...(placeholder && {
                    '--gn-placeholder-color': placeholder.color || '#aaaaaa',
                    '--gn-placeholder-bg': placeholder.bg || '#dddddd'
                }),
                ...(disabled && {
                    '--gn-disabled-color': disabled.color || '#acacac',
                    '--gn-disabled-bg': disabled.bg || '#fcfcfc'
                }),
                ...(danger && {
                    '--gn-danger-color': danger.color || '#D0021B'
                }),
                ...(primary && {
                    '--gn-primary-color': primary.color || '#ffffff',
                    '--gn-primary-bg': primary.bg || '#397AAB'
                }),
                ...(link && {
                    '--gn-link-color': link.color || '#397AAB',
                    '--gn-link-hover-color': link.hoverColor || '#1b4d74'
                }),
                ...(image && {
                    '--gn-image-color': image.color || '#ffffff',
                    '--gn-image-bg': image.bg || '#333333'
                }),
                ...(jumbotron && {
                    '--gn-jumbotron-color': jumbotron.color || '#ffffff',
                    '--gn-jumbotron-bg': jumbotron.bg || '#333333'
                }),
                ...(focus && {
                    '--gn-focus-color': focus.color || 'rgba(#397AAB, 0.4)'
                }),
                ...(tag && {
                    '--gn-tag-color': tag.color || '#000000',
                    '--gn-tag-hover-color': tag.hoverColor || '#ffffff',
                    '--gn-tag-hover-bg': tag.hoverBg || 'rgba(#397AAB, 0.75)',
                    '--gn-tag-active-color': tag.activeColor || '#ffffff',
                    '--gn-tag-active-bg': tag.activeBg || '#397AAB'
                }),
                ...(tag && {
                    '--gn-badge-color': badge.color || '#f2f2f2',
                    '--gn-badge-bg': badge.bg || '#777777'
                }),
                ...(footer && {
                    '--gn-footer-color': footer.color || '#000000',
                    '--gn-footer-bg': footer.bg || '#ffffff',
                    ...(footer?.link && {
                        '--gn-footer-link-color': footer.link.color || '#397AAB',
                        '--gn-footer-link-hover-color': footer.link.hoverColor || '#1b4d74'
                    })
                })
            };
        }
        return {};
    }, [theme]);
    return (
        <style dangerouslySetInnerHTML={{
            __html: rootVariables(variables)
        }} />
    );
}

RootStyle.defaultProps = {
    theme: {}
};

export default RootStyle;
