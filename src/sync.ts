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

interface RsyncInfo {
    type: string,
    msg: string,
}

function parse_rsync(r: string): any[] {
    const xs = r.split('\n');
    const ys = [] as RsyncInfo[];
    let i = 0;
    for (; i < xs.length;) {
        const x = xs[i];
        i++;
        if (!x) break;
        if (x[11] === ' ') {
            const t = x[0];
            const a  = {
                type: "",
                msg: "",
            };

            if (t === '.') continue;
            if (t === '*') {
                a.type = "-*";
                a.msg = x.substring("*deleting".length+1) ;
            }
            else {
                const f = x[1];
                switch (t) {
                    case '>': {
                        switch (f) {
                            case 'f': a.type = "+f"; break;
                            case 'd': a.type = "+d"; break;
                            default: a.type = x.substring(0, 11); break;
                        }
                        break;
                    }
                    case 'c': {
                        switch (f) {
                            case 'f': a.type = "~f"; break;
                            case 'd': a.type = "~d"; break;
                            default: a.type = x.substring(0, 11); break;
                        }
                        break;
                    }
                    default: {
                        a.type = x.substring(0, 11);
                        break;
                    }
                }
                a.msg = x.substring(12);
            }
            ys.push(a);
        }
        else {
            ys.push({
                type: '#',
                msg: x,
            });
        }
    }
    return ys;
}

function print_xs(msg: string, xs: any[]) {
    console.log(msg);
    console.log("--------");
    for (const x of xs) {
        console.log(`${x.type}: ${x.msg}`);
    }
}

export async function sync(dry: string) {
    const cf = JSON.parse(fs_read_utf8(cf_path));
    const cwd = fs_parse_path(cf_path).dir;

    for (const x of cf.sync) {
        const cmd = [
            "rsync",
            dry === "dry" ? "--dry-run" : "",
            x.files ? `--files-from=${x.files}` : "",
            x.include_file ? `--include-from=${x.include_file}` : "",
            x.exclude_file ? `--exclude-from=${x.exclude_file}` : "",
            "--itemize-changes",
            "--recursive",
            "--copy-links",
            "--copy-dirlinks",
            x.backup_dir ? `--backup-dir=${x.backup_dir}` : "",
            "--relative",
            "--partial",
            "--progress",
            "--delete-during",
            "--verbose",
            "--info=ALL",
            "--archive",
            "--compress",
            "--human-readable",
            fs_canonical_path(x.source_dir),
            fs_canonical_path(x.dest_dir)
        ].filter(x => !!x);
        console.log(cmd);
        const rv = await ps_exec(cwd, cmd, true);
        if (rv.length) {
            const ys = parse_rsync(rv[0]!);
            if (dry) {
                print_xs("deleted", ys.filter(y => y.type === '-*'));
                print_xs("changed_files", ys.filter(y => y.type === '~f'));
            }
            else {
                print_xs("log", ys.filter(y => ["~d", "#"].indexOf(y.type) === -1));
            }
        }
    }
}