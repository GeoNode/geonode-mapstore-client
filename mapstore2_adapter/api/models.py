# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

import random
import logging

from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import ugettext_noop as _

from jsonfield import JSONField

log = logging.getLogger(__name__)


def random_id():
    return random.randint(1000, 99999)


class MapStoreResource(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    id = models.BigIntegerField(
        primary_key=True,
        unique=True,
        editable=True,
        default=random_id)
    name = models.CharField(
        max_length=255,
        unique=False,
        blank=False,
        null=False)
    creation_date = models.DateTimeField(
        null=True,
        blank=True,
        auto_now_add=True)
    last_update = models.DateTimeField(
        null=True,
        blank=True,
        auto_now=True)
    data = models.OneToOneField(
        "MapStoreData",
        related_name="data",
        null=True,
        blank=True,
        on_delete=models.CASCADE)
    attributes = models.ManyToManyField(
        "MapStoreAttribute",
        related_name="attributes",
        null=True,
        blank=True)

    class Meta:
        db_table = 'mapstore2_adapter_mapstoreresource'
        indexes = [
            models.Index(fields=['id', ]),
            models.Index(fields=['name', ]),
        ]


class MapStoreAttribute(models.Model):
    TYPE_STRING = 'string'
    TYPE_NUMBER = 'number'
    TYPE_INTEGER = 'integer'
    TYPE_BOOLEAN = 'boolean'
    TYPE_BINARY = 'binary'

    TYPES = ((TYPE_STRING, _("String"),),
             (TYPE_NUMBER, _("Number"),),
             (TYPE_INTEGER, _("Integer",),),
             (TYPE_BOOLEAN, _("Boolean",),),
             (TYPE_BINARY, _("Binary",),),
             )

    name = models.CharField(
        max_length=255,
        unique=False,
        blank=False,
        null=False)
    label = models.CharField(
        max_length=255,
        unique=False,
        blank=True,
        null=True)
    type = models.CharField(
        max_length=80,
        unique=False,
        blank=False,
        null=False,
        choices=TYPES)
    value = models.TextField(
        db_column='value',
        blank=True)
    resource = models.ForeignKey(
        MapStoreResource,
        null=False,
        blank=False,
        on_delete=models.CASCADE)

    class Meta:
        db_table = 'mapstore2_adapter_mapstoreattribute'


class MapStoreData(models.Model):
    blob = JSONField(
        null=False,
        default={})
    resource = models.ForeignKey(
        MapStoreResource,
        null=False,
        blank=False,
        on_delete=models.CASCADE)

    class Meta:
        db_table = 'mapstore2_adapter_mapstoredata'
