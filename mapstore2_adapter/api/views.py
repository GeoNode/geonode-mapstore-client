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

from django.contrib.auth import get_user_model

from rest_framework import viewsets
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAdminUser, IsAuthenticated, IsAuthenticatedOrReadOnly  # noqa
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from geonode.base.api.permissions import IsOwnerOrReadOnly

from .models import MapStoreResource
from .serializers import (UserSerializer,
                          MapStoreResourceSerializer,)
from ..hooks import hookset

import logging

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    authentication_classes = (SessionAuthentication, BasicAuthentication, OAuth2Authentication)
    permission_classes = (IsAdminUser,)
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer


class MapStoreResourceViewSet(viewsets.ModelViewSet):
    """ Only Authenticate User perform CRUD Operations on Respective Data
    """
    authentication_classes = [SessionAuthentication, BasicAuthentication, OAuth2Authentication]
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    model = MapStoreResource
    serializer_class = MapStoreResourceSerializer

    def get_queryset(self):
        """ Return datasets belonging to the current user """
        queryset = self.model.objects.all()

        # filter to tasks owned by user making request
        queryset = hookset.get_queryset(self, queryset)
        return queryset

    def perform_create(self, serializer):
        """ Associate current user as task owner """
        if serializer.is_valid():
            hookset.perform_create(self, serializer)
            return serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """ Associate current user as task owner """
        if serializer.is_valid():
            hookset.perform_update(self, serializer)
            return serializer.save()
