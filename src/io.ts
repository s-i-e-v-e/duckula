/*
 * Copyright (c) 2022 Sieve
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export {ps_exec} from "https://raw.githubusercontent.com/s-i-e-v-e/nonstd/3747fa9db336220064a7dd7b34ce542befd201fd/src/ts/os/ps.ts"
import { fs_ls } from "https://raw.githubusercontent.com/s-i-e-v-e/nonstd/3747fa9db336220064a7dd7b34ce542befd201fd/src/ts/os/fs.ts"
export {
    fs_file_exists,
    fs_cp,
    fs_read_utf8,
    fs_read_utf8_list,
    fs_write_utf8,
    fs_write_utf8_list,
    fs_canonical_path,
    fs_parse_path
} from "https://raw.githubusercontent.com/s-i-e-v-e/nonstd/3747fa9db336220064a7dd7b34ce542befd201fd/src/ts/os/fs.ts"

export function list_entry_replace(xs: string[], find: string, replace: string) {
    let success = false;
    for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        if (x.match(find)) {
            xs[i] = replace;
            success = true;
        }
    }
    return success;
}

export function fs_file_ls(path: string) {
    return fs_ls(path).filter(x => x.isFile).map(x => x.name);
}

export function fs_dir_ls(path: string) {
    return fs_ls(path).filter(x => x.isDirectory).map(x => x.name);
}