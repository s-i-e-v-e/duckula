/*
 * Copyright (c) 2022 Sieve
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import _rules from "./theme_rules.json" assert {type: "json"};
import {
    fs_file_exists,
    ps_exec,
    fs_dir_ls,
    fs_cp,
    fs_file_ls,
    fs_read_utf8,
    fs_read_utf8_list,
    fs_write_utf8,
    fs_write_utf8_list,
    fs_canonical_path,
    list_entry_replace, fs_parse_path
} from "./io.ts";

interface Rule {
    app: string,
    config_path: string,
    config_paths?: string[],
}

const rules = _rules as Rule[];

type ThemeFunc = (x: Rule, y: Rule) => void;

function simple_file_copy(x: Rule, y: Rule) {
    fs_cp(x.config_path, y.config_path);
}

function simple_dir_copy(x: Rule, y: Rule) {
    for (const d of y.config_paths!) {
        for (const xx of fs_file_ls(x.config_path)) {
            fs_cp(`${x.config_path}/${xx}`, `${d}${xx}`);
        }
    }
}

function gtk_get_theme_name(path: string) {
    return fs_read_utf8_list(`${path}/index.theme`).filter(a => a.startsWith('Name='))[0].split('=')[1];
}

function update_gtk_settings(key: string, value: string) {
    const kv = `${key} = ${value}`;
    for (const v of ["gtk-3.0", "gtk-4.0"]) {
        const cfg_file = `$HOME/.config/${v}/settings.ini`;
        let ys: string[] = [];
        if (fs_file_exists(cfg_file)) {
            ys = fs_read_utf8_list(cfg_file);
            const success = list_entry_replace(ys, `/^${key}=.*`, kv);
            if (!success) {
                ys.push(kv);
            }
        }
        else {
            ys.push('[Settings]');
            ys.push(kv);
        }
        fs_write_utf8_list(cfg_file, ys);
    }
}

async function gtk_apply(x: Rule, y: Rule) {
    const theme = gtk_get_theme_name(x.config_path);
    await ps_exec(x.config_path, ["cp", "-r", ".", fs_canonical_path(`$HOME/.themes/${theme}`)]);

    // gnome
    await ps_exec(x.config_path, ["gsettings", "set", "org.gnome.desktop.interface", "gtk-theme", theme]);
    await ps_exec(x.config_path, ["gsettings", "set", "org.gnome.desktop.wm.preferences", "theme", theme]);

    update_gtk_settings('gtk-theme-name', theme);
}

async function gtk_icons_apply(x: Rule, y: Rule) {
    const theme = gtk_get_theme_name(x.config_path);
    await ps_exec(x.config_path, ["cp", "-r", ".", fs_canonical_path(`$HOME/.icons/${theme}`)]);
    await ps_exec(x.config_path, ["gsettings", "set", "org.gnome.desktop.interface", "icon-theme", theme]);

    update_gtk_settings('gtk-icon-theme-name', theme);
}

function xfce4_terminal_apply(x: Rule, y: Rule) {
    for (const ss of fs_file_ls(x.config_path).map(a => fs_read_utf8_list(`${x.config_path}/${a}`))) {
        const ds = fs_read_utf8_list(y.config_path);
        for (const s of ss) {
            if (!s.match('.*Color.*')) continue;
            const x = s.split('=')[0];
            const success = list_entry_replace(ds, `/^${x}=.*`, s);
            if (!success) {
                ds.push(s);
            }
        }
        fs_write_utf8_list(y.config_path, ds);
    }
}

function micro_apply(x: Rule, y: Rule) {
    simple_dir_copy(x, y);
    const conf_file = `${y.config_path}settings.json`;
    const a = JSON.parse(fs_read_utf8(conf_file));
    a.colorscheme = fs_parse_path(fs_file_ls(x.config_path)[0]).name;
    fs_write_utf8(conf_file, JSON.stringify(a));

    console.log('Add `export MICRO_TRUECOLOR=1` to your shell rc file');
}

function ghostwriter_apply(x: Rule, y: Rule) {
    simple_dir_copy(x, y);
    const conf_file = `${y.config_path}ghostwriter.conf`;
    const xs = fs_read_utf8_list(conf_file);
    const theme = fs_parse_path(fs_file_ls(x.config_path)[0]).name;
    list_entry_replace(xs, /^theme=.*$/.source, `theme=${theme}`);
    fs_write_utf8_list(conf_file, xs);
}

function kitty_apply(x: Rule, y: Rule) {
    simple_dir_copy(x, y);
    const file = fs_file_ls(x.config_path).filter(a => a !== 'diff.conf')[0];
    const entry = `include ${file}`;
    const conf_file = `${y.config_path}kitty.conf`;
    const xs = fs_file_exists(conf_file) ? fs_read_utf8_list(conf_file) : [];
    const a = xs.filter(x => x === entry)[0];
    if (!a) {
        xs.push(entry);
    }
    fs_write_utf8_list(conf_file, xs);
}

function i3_apply(x: Rule, y: Rule) {
    const f = fs_file_ls(x.config_path)[0];
    fs_cp(`${x.config_path}/${f}`, y.config_path);
}

function rofi_apply(x: Rule, y: Rule) {
    const file = "~/.config/rofi/colors.rasi";
    const entry = `@import "${file}"`;
    let xs: string[];
    if (fs_file_exists(y.config_path)) {
        xs = fs_read_utf8_list(y.config_path);

        const a = xs.filter(x => x === entry)[0];
        if (!a) {
            xs.push(entry);
        }
    }
    else {
        xs = [];
        xs.push(entry);
    }
    fs_write_utf8_list(y.config_path, xs);
    fs_cp(x.config_path, y.config_path.replace('config.rasi', 'colors.rasi'));
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
    "kitty": kitty_apply,
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
    console.log(`Applying themes from ${path}`);

    const xs = fs_dir_ls(path).map(x => { return {app: x, config_path: `${path}/${x}`} as Rule; });
    const cfg_file = `${path}/duckula.json`;
    for (const y of JSON.parse(fs_read_utf8(cfg_file)) as any[]) {
        const k = Object.keys(y)[0];
        const ys = xs.filter(x => x.app === k);
        if (ys[0]) {
            ys[0].config_path = `${path}/${y[k]}`;
        }
    }

    for (const x of xs) {
        apply(x);
    }
}