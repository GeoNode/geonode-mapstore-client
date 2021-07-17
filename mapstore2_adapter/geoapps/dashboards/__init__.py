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


class DashboardAppsConfig(GeoNodeAppsConfig):

    name = 'mapstore2_adapter.geoapps.dashboards'
    label = "geoapp_dashboards"
    default_model = 'Dashboard'
    verbose_name = "GeoNode App: Dashboard"
    type = 'GEONODE_APP'

    NOTIFICATIONS = (("dashboard_created", _("Dashboard Created"), _("A Dashboard was created"),),
                     ("dashboard_updated", _("Dashboard Updated"), _("A Dashboard was updated"),),
                     ("dashboard_approved", _("Dashboard Approved"), _("A Dashboard was approved by a Manager"),),
                     ("dashboard_published", _("Dashboard Published"), _("A Dashboard was published"),),
                     ("dashboard_deleted", _("Dashboard Deleted"), _("A Dashboard was deleted"),),
                     ("dashboard_comment", _("Comment on Dashboard"), _("A Dashboard was commented on"),),
                     ("dashboard_rated", _("Rating for Dashboard"), _("A rating was given to a Dashboard"),),
                     )


default_app_config = "mapstore2_adapter.geoapps.dashboards.DashboardAppsConfig"
