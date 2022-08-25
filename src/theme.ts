/*
 * Copyright (c) 2022 Sieve
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import _rules from "./theme_rules.json" assert {type: "json"};
import {
    canonical_path,
    exec, io_dir_ls,
    io_file_cp,
    io_file_exists, io_file_ls, io_get_file_name_part, io_read_text,
    io_read_text_as_list, io_write_text,
    io_write_text_as_list,
    list_entry_replace
} from "./io.ts";

interface Rule {
    app: string,
    config_path: string,
    config_paths?: string[],
}

const rules = _rules as Rule[];

type ThemeFunc = (x: Rule, y: Rule) => void;

function simple_file_copy(x: Rule, y: Rule) {
    io_file_cp(x.config_path, y.config_path);
}

function simple_dir_copy(x: Rule, y: Rule) {
    for (const d of y.config_paths!) {
        for (const xx of io_file_ls(x.config_path)) {
            io_file_cp(`${x.config_path}/${xx}`, `${d}${xx}`);
        }
    }
}

function gtk_get_theme_name(path: string) {
    return io_read_text_as_list(`${path}/index.theme`).filter(a => a.startsWith('Name='))[0].split('=')[1];
}

function gtk_apply(x: Rule, y: Rule) {
    const theme = gtk_get_theme_name(x.config_path);
    exec(x.config_path, ["gsettings", "set", "org.gnome.desktop.interface", "gtk-theme", theme]);
    exec(x.config_path, ["gsettings", "set", "org.gnome.desktop.wm.preferences", "theme", theme]);
}

function gtk_icons_apply(x: Rule, y: Rule) {
    const theme = gtk_get_theme_name(x.config_path);
    exec(x.config_path, ["gsettings", "set", "org.gnome.desktop.interface", "icon-theme", theme]);
}

function xfce4_terminal_apply(x: Rule, y: Rule) {
    for (const ss of io_file_ls(x.config_path).map(a => io_read_text_as_list(`${x.config_path}/${a}`))) {
        const ds = io_read_text_as_list(y.config_path);
        for (const s of ss) {
            if (!s.startsWith('Color')) continue;
            const x = s.split('=')[0];
            const n = ds.findIndex(a => a.startsWith(x));
            if (n >= 0) {
                ds[n] = s;
            }
            else {
                ds.push(s);
            }
        }
        io_write_text_as_list(y.config_path, ds);
    }
}

function micro_apply(x: Rule, y: Rule) {
    simple_dir_copy(x, y);
    const conf_file = `${y.config_path}settings.json`;
    const a = JSON.parse(io_read_text(conf_file));
    a.colorscheme = io_get_file_name_part(x.config_path);
    io_write_text(conf_file, JSON.stringify(a));

    console.log('Add `export MICRO_TRUECOLOR=1` to your shell rc file');
}

function ghostwriter_apply(x: Rule, y: Rule) {
    simple_dir_copy(x, y);
    const conf_file = `${y.config_path}ghostwriter.conf`;
    const xs = io_read_text_as_list(conf_file);
    const theme = io_get_file_name_part(io_file_ls(x.config_path)[0]);
    list_entry_replace(xs, /^theme=.*$/.source, `theme=${theme}`);
    io_write_text_as_list(conf_file, xs);
}

function i3_apply(x: Rule, y: Rule) {
    const f = io_file_ls(x.config_path)[0];
    io_file_cp(`${x.config_path}/${f}`, y.config_path);
}

function rofi_apply(x: Rule, y: Rule) {
    const file = "~/.config/rofi/colors.rasi";
    const entry = `@import "${file}"`;
    let xs: string[];
    if (io_file_exists(y.config_path)) {
        xs = io_read_text_as_list(y.config_path);

        const a = xs.filter(x => x === entry)[0];
        if (!a) {
            xs.push(entry);
        }
    }
    else {
        xs = [];
        xs.push(entry);
    }
    io_write_text_as_list(y.config_path, xs);
    io_file_cp(x.config_path, y.config_path.replace('config.rasi', 'colors.rasi'));
}

const functions = {
    "rofi": rofi_apply,
    "i3": i3_apply,
    "ghostwriter": ghostwriter_apply,
    "mousepad": simple_dir_copy,
    "xfce4_terminal": xfce4_terminal_apply,
    "gtk": gtk_apply,
    "gtk_icons": gtk_icons_apply,
    "micro": micro_apply,
} as { [index: string]: ThemeFunc };

function apply(x: Rule) {
    const fn = functions[x.app] as ThemeFunc;
    if (fn) {
        fn(x, rules.filter(y => y.app === x.app)[0]);
    }
    else {
        console.log(`Unknown app: ${x.app}`);
    }
}

export function theme_apply(path: string) {
    if (!Deno.env.get('XDG_CONFIG_HOME')) {
        const x = Deno.env.get('HOME');
        if (!x) throw new Error('$XDG_CONFIG_HOME and $HOME are not defined.');
        Deno.env.set('XDG_CONFIG_HOME', `${x}/.config`);
    }

    console.log(`Applying themes from ${path}`);

    const xs = io_dir_ls(path).map(x => { return {app: x, config_path: canonical_path(`${path}/${x}`)} as Rule; });
    const cfg_file = `${path}/duckula.json`;
    for (const y of JSON.parse(io_read_text(cfg_file)) as any[]) {
        const k = Object.keys(y)[0];
        const ys = xs.filter(x => x.app === k);
        if (ys[0]) {
            ys[0].config_path = canonical_path(`${path}/${y[k]}`)
        }
    }

    for (const x of xs) {
        apply(x);
    }
}