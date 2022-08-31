/*
 * Copyright (c) 2022 Sieve
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    ps_exec,
} from "./io.ts";

export async function os_ul() {
    await ps_exec('.', ["sudo", "passwd", "-Sa"]);
}

export async function os_ugl(g: string) {
    await ps_exec('.', ["grep", g, "/etc/group"]);
}

export async function os_gl() {
    await ps_exec('.', ["cat", "/etc/group"]);
}

export async function os_gul(u: string) {
    await ps_exec('.', ["groups", u]);
}