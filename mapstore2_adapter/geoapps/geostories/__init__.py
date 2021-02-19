# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright (C) 2020 OSGeo
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
#
#########################################################################
from django.utils.translation import ugettext_noop as _
from geonode.geoapps import GeoNodeAppsConfig


class GeoStoryAppsConfig(GeoNodeAppsConfig):

    name = 'mapstore2_adapter.geoapps.geostories'
    label = "geoapp_geostories"
    default_model = 'GeoStory'
    verbose_name = "GeoNode App: GeoStory"
    type = 'GEONODE_APP'

    NOTIFICATIONS = (("geostory_created", _("GeoStory Created"), _("A GeoStory was created"),),
                     ("geostory_updated", _("GeoStory Updated"), _("A GeoStory was updated"),),
                     ("geostory_approved", _("GeoStory Approved"), _("A GeoStory was approved by a Manager"),),
                     ("geostory_published", _("GeoStory Published"), _("A GeoStory was published"),),
                     ("geostory_deleted", _("GeoStory Deleted"), _("A GeoStory was deleted"),),
                     ("geostory_comment", _("Comment on GeoStory"), _("A GeoStory was commented on"),),
                     ("geostory_rated", _("Rating for GeoStory"), _("A rating was given to a GeoStory"),),
                     )


default_app_config = "mapstore2_adapter.geoapps.geostories.GeoStoryAppsConfig"
