/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import {
    METADATA,
    RESOURCES,
    getEndpointUrl
} from './constants';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';
import { getDefaultFormState } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const uiKeys = (entry) => Object.keys(entry).filter(propertyKey => propertyKey.indexOf('ui:') === 0);

const parseUiSchema = (properties) => {
    return Object.keys(properties).reduce((acc, key) => {
        const entry = properties[key];
        const uiKeysRoot = uiKeys(entry);
        if (uiKeysRoot.length) {
            acc[key] = Object.fromEntries(uiKeysRoot.map(uiKey => [uiKey, entry[uiKey]]));
        }
        if (entry.type === 'array') {
            const uiKeysNested = uiKeys(entry?.items);
            if (uiKeysNested.length) {
                acc[key] = Object.fromEntries(uiKeysNested.map(uiKey => [uiKey, entry?.items?.[uiKey]]));
            }
        }
        if (entry.type === 'object') {
            const nestedProperties = parseUiSchema(entry?.properties);
            acc[key] = { ...acc[key], ...nestedProperties };
        }
        if (entry.type === 'array' && entry.items?.type === 'object') {
            const nestedProperties = parseUiSchema(entry?.items?.properties);
            acc[key] = { ...acc[key], ...(!isEmpty(nestedProperties) && {items: {...nestedProperties}}) };
        }
        return acc;
    }, {});
};

let metadataSchemas;
export const getMetadataSchema = () => {
    if (metadataSchemas) {
        return Promise.resolve(metadataSchemas);
    }
    return axios.get(getEndpointUrl(METADATA, '/schema/'))
        .then(({ data }) => {
            const schema = {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "$id": "https://development.demo.geonode.org//resource.json",
                "title": "GeoNode resource",
                "type": "object",
                "properties": {
                    "uuid": {
                        "type": "string",
                        "title": "UUID",
                        "maxLength": 36,
                        "readOnly": true,
                        "geonode:handler": "base"
                    },
                    "title": {
                        "type": "string",
                        "title": "Title",
                        "description": "name by which the cited resource is known",
                        "maxLength": 255,
                        "geonode:handler": "base",
                        "geonode:required": true
                    },
                    "abstract": {
                        "type": "string",
                        "title": "Abstract",
                        "description": "brief narrative summary of the content of the resource(s)",
                        "maxLength": 2000,
                        "ui:options": {
                            "widget": "textarea",
                            "rows": 5
                        },
                        "geonode:handler": "base",
                        "geonode:required": true
                    },
                    "date": {
                        "type": "string",
                        "format": "date-time",
                        "title": "Date",
                        "geonode:required": true,
                        "geonode:handler": "base"
                    },
                    "date_type": {
                        "type": "string",
                        "title": "date type",
                        "maxLength": 255,
                        "geonode:required": true,
                        "geonode:handler": "base",
                        "oneOf": [
                            {
                                "const": "creation",
                                "title": "Creation"
                            },
                            {
                                "const": "publication",
                                "title": "Publication"
                            },
                            {
                                "const": "revision",
                                "title": "Revision"
                            }
                        ],
                        "default": "Publication"
                    },
                    "category": {
                        "type": "object",
                        "title": "Category",
                        "description": "high-level geographic data thematic classification to assist in the grouping and search of available geographic data sets.",
                        "properties": {
                            "id": {
                                "type": "string"
                            },
                            "label": {
                                "type": "string"
                            }
                        },
                        "required": [
                            "id"
                        ],
                        "geonode:required": true,
                        "geonode:handler": "base",
                        "ui:options": {
                            "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/categories"
                        }
                    },
                    "tkeywords": {
                        "type": "object",
                        "title": "Keywords from Thesaurus",
                        "description": "List of keywords from Thesaurus",
                        "geonode:handler": "thesaurus",
                        "properties": {
                            "dcat_publishertype": {
                                "type": "array",
                                "title": "Thesaurus: dcat_publishertype",
                                "description": "Thesaurus: dcat_publishertype",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "keyword id",
                                            "description": "The id of the keyword (usually a URI)"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "Label",
                                            "description": "localized label for the keyword"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/thesaurus/5/keywords"
                                },
                                "minItems": 0,
                                "maxItems": 1
                            },
                            "3-2-4-1_gemet-inspire-themes": {
                                "type": "array",
                                "title": "GEMET - INSPIRE themes, version 1.0",
                                "description": "GEMET - INSPIRE themes, version 1.0",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "keyword id",
                                            "description": "The id of the keyword (usually a URI)"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "Label",
                                            "description": "localized label for the keyword"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/thesaurus/6/keywords"
                                },
                                "minItems": 1
                            },
                            "3-2-4-2-prioritydataset-rdf": {
                                "type": "array",
                                "title": "INSPIRE priority data set",
                                "description": "List of data sets related to environmental reporting, which should be made available by Member States through the European Spatial Data Infrastructure in a stepwise manner. The list also reflects the data gaps identified during the evaluation of the state-of-implementation and the fitness of the Directive for its intended purpose (a so-called REFIT evaluation)",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "keyword id",
                                            "description": "The id of the keyword (usually a URI)"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "Label",
                                            "description": "localized label for the keyword"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/thesaurus/1/keywords"
                                },
                                "minItems": 0
                            },
                            "sample_thesaurus": {
                                "type": "array",
                                "title": "Sample thesaurus",
                                "description": "Just a sample thesaurus",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "keyword id",
                                            "description": "The id of the keyword (usually a URI)"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "Label",
                                            "description": "localized label for the keyword"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/thesaurus/2/keywords"
                                },
                                "minItems": 0,
                                "maxItems": 1
                            }
                        }
                    },
                    "hkeywords": {
                        "type": "array",
                        "title": "Keywords",
                        "description": "Hierarchical keywords",
                        "items": {
                            "type": "string"
                        },
                        "ui:options": {
                            "geonode-ui:autocomplete": {
                                "url": "/api/v2/metadata/autocomplete/hkeywords",
                                "creatable": true
                            }
                        },
                        "geonode:handler": "hkeyword"
                    },
                    "language": {
                        "type": "string",
                        "title": "Language",
                        "description": "language used within the dataset",
                        "maxLength": 16,
                        "geonode:required": true,
                        "geonode:handler": "base",
                        "oneOf": [
                            {
                                "const": "abk",
                                "title": "Abkhazian"
                            },
                            {
                                "const": "aar",
                                "title": "Afar"
                            },
                            {
                                "const": "afr",
                                "title": "Afrikaans"
                            },
                            {
                                "const": "amh",
                                "title": "Amharic"
                            },
                            {
                                "const": "ara",
                                "title": "Arabic"
                            },
                            {
                                "const": "asm",
                                "title": "Assamese"
                            },
                            {
                                "const": "aym",
                                "title": "Aymara"
                            },
                            {
                                "const": "aze",
                                "title": "Azerbaijani"
                            },
                            {
                                "const": "bak",
                                "title": "Bashkir"
                            },
                            {
                                "const": "ben",
                                "title": "Bengali"
                            },
                            {
                                "const": "bih",
                                "title": "Bihari"
                            },
                            {
                                "const": "bis",
                                "title": "Bislama"
                            },
                            {
                                "const": "bre",
                                "title": "Breton"
                            },
                            {
                                "const": "bul",
                                "title": "Bulgarian"
                            },
                            {
                                "const": "bel",
                                "title": "Byelorussian"
                            },
                            {
                                "const": "cat",
                                "title": "Catalan"
                            },
                            {
                                "const": "chi",
                                "title": "Chinese"
                            },
                            {
                                "const": "cos",
                                "title": "Corsican"
                            },
                            {
                                "const": "dan",
                                "title": "Danish"
                            },
                            {
                                "const": "dzo",
                                "title": "Dzongkha"
                            },
                            {
                                "const": "eng",
                                "title": "English"
                            },
                            {
                                "const": "fra",
                                "title": "French"
                            },
                            {
                                "const": "epo",
                                "title": "Esperanto"
                            },
                            {
                                "const": "est",
                                "title": "Estonian"
                            },
                            {
                                "const": "fao",
                                "title": "Faroese"
                            },
                            {
                                "const": "fij",
                                "title": "Fijian"
                            },
                            {
                                "const": "fin",
                                "title": "Finnish"
                            },
                            {
                                "const": "fry",
                                "title": "Frisian"
                            },
                            {
                                "const": "glg",
                                "title": "Gallegan"
                            },
                            {
                                "const": "ger",
                                "title": "German"
                            },
                            {
                                "const": "gre",
                                "title": "Greek"
                            },
                            {
                                "const": "kal",
                                "title": "Greenlandic"
                            },
                            {
                                "const": "grn",
                                "title": "Guarani"
                            },
                            {
                                "const": "guj",
                                "title": "Gujarati"
                            },
                            {
                                "const": "hau",
                                "title": "Hausa"
                            },
                            {
                                "const": "heb",
                                "title": "Hebrew"
                            },
                            {
                                "const": "hin",
                                "title": "Hindi"
                            },
                            {
                                "const": "hun",
                                "title": "Hungarian"
                            },
                            {
                                "const": "ind",
                                "title": "Indonesian"
                            },
                            {
                                "const": "ina",
                                "title": "Interlingua (International Auxiliary language Association)"
                            },
                            {
                                "const": "iku",
                                "title": "Inuktitut"
                            },
                            {
                                "const": "ipk",
                                "title": "Inupiak"
                            },
                            {
                                "const": "ita",
                                "title": "Italian"
                            },
                            {
                                "const": "jpn",
                                "title": "Japanese"
                            },
                            {
                                "const": "kan",
                                "title": "Kannada"
                            },
                            {
                                "const": "kas",
                                "title": "Kashmiri"
                            },
                            {
                                "const": "kaz",
                                "title": "Kazakh"
                            },
                            {
                                "const": "khm",
                                "title": "Khmer"
                            },
                            {
                                "const": "kin",
                                "title": "Kinyarwanda"
                            },
                            {
                                "const": "kir",
                                "title": "Kirghiz"
                            },
                            {
                                "const": "kor",
                                "title": "Korean"
                            },
                            {
                                "const": "kur",
                                "title": "Kurdish"
                            },
                            {
                                "const": "oci",
                                "title": "Langue d 'Oc (post 1500)"
                            },
                            {
                                "const": "lao",
                                "title": "Lao"
                            },
                            {
                                "const": "lat",
                                "title": "Latin"
                            },
                            {
                                "const": "lav",
                                "title": "Latvian"
                            },
                            {
                                "const": "lin",
                                "title": "Lingala"
                            },
                            {
                                "const": "lit",
                                "title": "Lithuanian"
                            },
                            {
                                "const": "mlg",
                                "title": "Malagasy"
                            },
                            {
                                "const": "mlt",
                                "title": "Maltese"
                            },
                            {
                                "const": "mar",
                                "title": "Marathi"
                            },
                            {
                                "const": "mol",
                                "title": "Moldavian"
                            },
                            {
                                "const": "mon",
                                "title": "Mongolian"
                            },
                            {
                                "const": "nau",
                                "title": "Nauru"
                            },
                            {
                                "const": "nep",
                                "title": "Nepali"
                            },
                            {
                                "const": "nor",
                                "title": "Norwegian"
                            },
                            {
                                "const": "ori",
                                "title": "Oriya"
                            },
                            {
                                "const": "orm",
                                "title": "Oromo"
                            },
                            {
                                "const": "pan",
                                "title": "Panjabi"
                            },
                            {
                                "const": "pol",
                                "title": "Polish"
                            },
                            {
                                "const": "por",
                                "title": "Portuguese"
                            },
                            {
                                "const": "pus",
                                "title": "Pushto"
                            },
                            {
                                "const": "que",
                                "title": "Quechua"
                            },
                            {
                                "const": "roh",
                                "title": "Rhaeto-Romance"
                            },
                            {
                                "const": "run",
                                "title": "Rundi"
                            },
                            {
                                "const": "rus",
                                "title": "Russian"
                            },
                            {
                                "const": "smo",
                                "title": "Samoan"
                            },
                            {
                                "const": "sag",
                                "title": "Sango"
                            },
                            {
                                "const": "san",
                                "title": "Sanskrit"
                            },
                            {
                                "const": "scr",
                                "title": "Serbo-Croatian"
                            },
                            {
                                "const": "sna",
                                "title": "Shona"
                            },
                            {
                                "const": "snd",
                                "title": "Sindhi"
                            },
                            {
                                "const": "sin",
                                "title": "Singhalese"
                            },
                            {
                                "const": "ssw",
                                "title": "Siswant"
                            },
                            {
                                "const": "slv",
                                "title": "Slovenian"
                            },
                            {
                                "const": "som",
                                "title": "Somali"
                            },
                            {
                                "const": "sot",
                                "title": "Sotho"
                            },
                            {
                                "const": "spa",
                                "title": "Spanish"
                            },
                            {
                                "const": "sun",
                                "title": "Sudanese"
                            },
                            {
                                "const": "swa",
                                "title": "Swahili"
                            },
                            {
                                "const": "tgl",
                                "title": "Tagalog"
                            },
                            {
                                "const": "tgk",
                                "title": "Tajik"
                            },
                            {
                                "const": "tam",
                                "title": "Tamil"
                            },
                            {
                                "const": "tat",
                                "title": "Tatar"
                            },
                            {
                                "const": "tel",
                                "title": "Telugu"
                            },
                            {
                                "const": "tha",
                                "title": "Thai"
                            },
                            {
                                "const": "tir",
                                "title": "Tigrinya"
                            },
                            {
                                "const": "tog",
                                "title": "Tonga (Nyasa)"
                            },
                            {
                                "const": "tso",
                                "title": "Tsonga"
                            },
                            {
                                "const": "tsn",
                                "title": "Tswana"
                            },
                            {
                                "const": "tur",
                                "title": "Turkish"
                            },
                            {
                                "const": "tuk",
                                "title": "Turkmen"
                            },
                            {
                                "const": "twi",
                                "title": "Twi"
                            },
                            {
                                "const": "uig",
                                "title": "Uighur"
                            },
                            {
                                "const": "ukr",
                                "title": "Ukrainian"
                            },
                            {
                                "const": "urd",
                                "title": "Urdu"
                            },
                            {
                                "const": "uzb",
                                "title": "Uzbek"
                            },
                            {
                                "const": "vie",
                                "title": "Vietnamese"
                            },
                            {
                                "const": "vol",
                                "title": "Volapük"
                            },
                            {
                                "const": "wol",
                                "title": "Wolof"
                            },
                            {
                                "const": "xho",
                                "title": "Xhosa"
                            },
                            {
                                "const": "yid",
                                "title": "Yiddish"
                            },
                            {
                                "const": "yor",
                                "title": "Yoruba"
                            },
                            {
                                "const": "zha",
                                "title": "Zhuang"
                            },
                            {
                                "const": "zul",
                                "title": "Zulu"
                            }
                        ]
                    },
                    "license": {
                        "type": "object",
                        "title": "License",
                        "description": "license of the dataset",
                        "maxLength": 255,
                        "properties": {
                            "id": {
                                "type": "string"
                            },
                            "label": {
                                "type": "string"
                            }
                        },
                        "required": [
                            "id"
                        ],
                        "geonode:required": true,
                        "geonode:handler": "base",
                        "ui:options": {
                            "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/licenses"
                        }
                    },
                    "attribution": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "title": "Attribution",
                        "description": "authority or function assigned, as to a ruler, legislative assembly, delegate, or the like.",
                        "maxLength": 2048,
                        "geonode:handler": "base"
                    },
                    "regions": {
                        "type": "array",
                        "title": "Regions",
                        "description": "keyword identifies a location",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "string"
                                },
                                "label": {
                                    "type": "string",
                                    "title": "title"
                                }
                            }
                        },
                        "geonode:handler": "region",
                        "ui:options": {
                            "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/regions"
                        }
                    },
                    "data_quality_statement": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "title": "data quality statement",
                        "description": "general explanation of the data producer's knowledge about the lineage of a dataset",
                        "maxLength": 2000,
                        "ui:options": {
                            "widget": "textarea",
                            "rows": 5
                        },
                        "geonode:handler": "base"
                    },
                    "restriction_code_type": {
                        "type": "string",
                        "title": "restrictions",
                        "description": "limitation(s) placed upon the access or use of the data.",
                        "maxLength": 255,
                        "geonode:handler": "base",
                        "oneOf": [
                            {
                                "const": "copyright",
                                "title": "copyright",
                                "description": "exclusive right to the publication, production, or sale of the rights to a literary, dramatic, musical, or artistic work, or to the use of a commercial print or label, granted by law for a specified period of time to an author, composer, artist, distributor"
                            },
                            {
                                "const": "intellectualPropertyRights",
                                "title": "intellectualPropertyRights",
                                "description": "rights to financial benefit from and control of distribution of non-tangible property that is a result of creativity"
                            },
                            {
                                "const": "license",
                                "title": "license",
                                "description": "formal permission to do something"
                            },
                            {
                                "const": "otherRestrictions",
                                "title": "otherRestrictions",
                                "description": "limitation not listed"
                            },
                            {
                                "const": "patent",
                                "title": "patent",
                                "description": "government has granted exclusive right to make, sell, use or license an invention or discovery"
                            },
                            {
                                "const": "patentPending",
                                "title": "patentPending",
                                "description": "produced or sold information awaiting a patent"
                            },
                            {
                                "const": "restricted",
                                "title": "restricted",
                                "description": "withheld from general circulation or disclosure"
                            },
                            {
                                "const": "trademark",
                                "title": "trademark",
                                "description": "a name, symbol, or other device identifying a product, officially registered and legally restricted to the use of the owner or manufacturer"
                            }
                        ]
                    },
                    "constraints_other": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "title": "Other constraints",
                        "description": "other restrictions and legal prerequisites for accessing and using the resource or metadata",
                        "ui:options": {
                            "widget": "textarea",
                            "rows": 5
                        },
                        "geonode:handler": "base"
                    },
                    "edition": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "title": "edition",
                        "description": "version of the cited resource",
                        "maxLength": 255,
                        "geonode:handler": "base"
                    },
                    "doi": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "title": "DOI",
                        "description": "a DOI will be added by Admin before publication.",
                        "maxLength": 255,
                        "geonode:handler": "doi"
                    },
                    "purpose": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "title": "purpose",
                        "description": "summary of the intentions with which the resource(s) was developed",
                        "maxLength": 500,
                        "ui:options": {
                            "widget": "textarea",
                            "rows": 5
                        },
                        "geonode:handler": "base"
                    },
                    "supplemental_information": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "title": "supplemental information",
                        "description": "any other descriptive information about the dataset",
                        "maxLength": 2000,
                        "default": "No information provided",
                        "ui:options": {
                            "widget": "textarea",
                            "rows": 5
                        },
                        "geonode:handler": "base"
                    },
                    "temporal_extent_start": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "format": "date-time",
                        "title": "temporal extent start",
                        "description": "time period covered by the content of the dataset (start)",
                        "geonode:handler": "base"
                    },
                    "temporal_extent_end": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "format": "date-time",
                        "title": "temporal extent end",
                        "description": "time period covered by the content of the dataset (end)",
                        "geonode:handler": "base"
                    },
                    "maintenance_frequency": {
                        "type": "string",
                        "title": "maintenance frequency",
                        "description": "frequency with which modifications and deletions are made to the data after it is first produced",
                        "maxLength": 255,
                        "geonode:handler": "base",
                        "oneOf": [
                            {
                                "const": "unknown",
                                "title": "frequency of maintenance for the data is not known"
                            },
                            {
                                "const": "continual",
                                "title": "data is repeatedly and frequently updated"
                            },
                            {
                                "const": "notPlanned",
                                "title": "there are no plans to update the data"
                            },
                            {
                                "const": "daily",
                                "title": "data is updated each day"
                            },
                            {
                                "const": "annually",
                                "title": "data is updated every year"
                            },
                            {
                                "const": "asNeeded",
                                "title": "data is updated as deemed necessary"
                            },
                            {
                                "const": "monthly",
                                "title": "data is updated each month"
                            },
                            {
                                "const": "fortnightly",
                                "title": "data is updated every two weeks"
                            },
                            {
                                "const": "irregular",
                                "title": "data is updated in intervals that are uneven in duration"
                            },
                            {
                                "const": "weekly",
                                "title": "data is updated on a weekly basis"
                            },
                            {
                                "const": "biannually",
                                "title": "data is updated twice each year"
                            },
                            {
                                "const": "quarterly",
                                "title": "data is updated every three months"
                            }
                        ]
                    },
                    "spatial_representation_type": {
                        "type": "string",
                        "title": "spatial representation type",
                        "description": "method used to represent geographic information in the dataset.",
                        "maxLength": 255,
                        "geonode:handler": "base",
                        "oneOf": [
                            {
                                "const": "grid",
                                "title": "grid",
                                "description": "grid data is used to represent geographic data"
                            },
                            {
                                "const": "stereoModel",
                                "title": "stereoModel",
                                "description": "three-dimensional view formed by the intersecting homologous rays of an overlapping pair of images"
                            },
                            {
                                "const": "textTable",
                                "title": "textTable",
                                "description": "textual or tabular data is used to represent geographic data"
                            },
                            {
                                "const": "tin",
                                "title": "tin",
                                "description": "triangulated irregular network"
                            },
                            {
                                "const": "vector",
                                "title": "vector",
                                "description": "vector data is used to represent geographic data"
                            },
                            {
                                "const": "video",
                                "title": "video",
                                "description": "scene from a video recording"
                            }
                        ]
                    },
                    "linkedresources": {
                        "type": "array",
                        "title": "Related resources",
                        "description": "Resources related to this one",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "string"
                                },
                                "label": {
                                    "type": "string",
                                    "title": "title"
                                }
                            }
                        },
                        "geonode:handler": "linkedresource",
                        "ui:options": {
                            "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/resources"
                        }
                    },
                    "contacts": {
                        "type": "object",
                        "title": "contacts",
                        "properties": {
                            "owner": {
                                "type": "object",
                                "title": "Owner",
                                "properties": {
                                    "id": {
                                        "type": "string",
                                        "title": "User id",
                                        "ui:widget": "hidden"
                                    },
                                    "label": {
                                        "type": "string",
                                        "title": "User name"
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                },
                                "required": [
                                    "id"
                                ]
                            },
                            "author": {
                                "type": "array",
                                "title": "Metadata Author",
                                "minItems": 1,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "processor": {
                                "type": "array",
                                "title": "Processor",
                                "minItems": 0,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "publisher": {
                                "type": "array",
                                "title": "Publisher",
                                "minItems": 0,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "custodian": {
                                "type": "array",
                                "title": "Custodian",
                                "minItems": 0,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "pointOfContact": {
                                "type": "array",
                                "title": "Point of Contact",
                                "minItems": 1,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "distributor": {
                                "type": "array",
                                "title": "Distributor",
                                "minItems": 0,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "resource_user": {
                                "type": "array",
                                "title": "Resource User",
                                "minItems": 0,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "resource_provider": {
                                "type": "array",
                                "title": "Resource Provider",
                                "minItems": 0,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "originator": {
                                "type": "array",
                                "title": "Originator",
                                "minItems": 0,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            },
                            "principal_investigator": {
                                "type": "array",
                                "title": "Principal Investigator",
                                "minItems": 0,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "title": "User id"
                                        },
                                        "label": {
                                            "type": "string",
                                            "title": "User name"
                                        }
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/users"
                                }
                            }
                        },
                        "required": [
                            "owner",
                            "author",
                            "pointOfContact"
                        ],
                        "geonode:required": true,
                        "geonode:handler": "contact"
                    }
                },
                "required": [
                    "title",
                    "abstract",
                    "date",
                    "date_type",
                    "category",
                    "language",
                    "license",
                    "contacts"
                ]
            } || data;
            metadataSchemas = {
                schema: schema,
                uiSchema: parseUiSchema(schema?.properties || {})
            };
            return metadataSchemas;
        });
};

const removeNullValueRecursive = (metadata = {}, schema = {}) => {
    return Object.keys(metadata).reduce((acc, key) => {
        const schemaTypes = castArray(schema?.[key]?.type || []);
        if (metadata[key] === null && !schemaTypes.includes('null')) {
            return {
                ...acc,
                [key]: undefined
            };
        }
        return {
            ...acc,
            [key]: !isArray(metadata[key]) && isObject(metadata[key])
                ? removeNullValueRecursive(metadata[key], schema[key])
                : metadata[key]
        };
    }, {});
};

export const getMetadataByPk = (pk) => {
    return getMetadataSchema()
        .then(({ schema, uiSchema }) => {
            const resourceProperties = ['pk', 'title', 'detail_url', 'perms'];
            return Promise.all([
                axios.get(getEndpointUrl(METADATA, `/instance/${pk}/`)),
                axios.get(getEndpointUrl(RESOURCES, `/${pk}/?exclude[]=*&${resourceProperties.map(value => `include[]=${value}`).join('&')}`))
            ])
                .then((response) => {
                    const metadataResponse = response?.[0]?.data || {};
                    const resource = response?.[1]?.data?.resource || {};
                    let { extraErrors, ...metadata } = metadataResponse;
                    metadata = removeNullValueRecursive(metadata, schema?.properties);
                    metadata = getDefaultFormState(validator, schema, metadata, schema, false,
                        // to avoid populating with empty items in arrays
                        {
                            arrayMinItems: {
                                populate: 'never'
                            }
                        }
                    );
                    return {
                        schema,
                        uiSchema,
                        metadata,
                        resource,
                        extraErrors
                    };
                });
        });
};

export const updateMetadata = (pk, body) => {
    return axios.put(getEndpointUrl(METADATA, `/instance/${pk}/`), body)
        .then(({ data }) => data);
};
