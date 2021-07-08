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

from django.utils.translation import ugettext_noop as _


log = logging.getLogger(__name__)


def random_id():
    return random.randint(1000, 99999)

