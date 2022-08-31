/*
 * Copyright (c) 2022 Sieve
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    fs_canonical_path, fs_parse_path,
    fs_read_utf8,
    ps_exec,
} from "./io.ts";

const cf_path = fs_canonical_path("$XDG_CONFIG_HOME/duckula/config.json");

export async function sync(file: string) {
    const cf = JSON.parse(fs_read_utf8(cf_path));
    const xs = [];
    let cwd = '.';
    if (file) {
        xs.push(JSON.parse(fs_read_utf8(file)));
        cwd = fs_parse_path(file).dir;
    }
    else {
        xs.push(...cf.sync);
        cwd = fs_parse_path(cf_path).dir;
    }

    for (const x of xs) {
        await ps_exec(cwd, [
            "rsync",
            //"--dry-run",
            `--files-from=${x.include_file}`,
            "--itemize-changes",
            "--recursive",
            "--copy-links",
            "--copy-dirlinks",
            "--relative",
            "--partial",
            "--progress",
            "--delete-during",
            "--verbose",
            "--archive",
            "--compress",
            "--human-readable",
            "--log-file=rsync.log",
            fs_canonical_path(x.source_dir),
            fs_canonical_path(x.dest_dir)
        ]);
    }
}