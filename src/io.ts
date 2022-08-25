export function list_entry_replace(xs: string[], find: string, replace: string) {
    for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        if (x.match(find)) {
            xs[i] = replace;
        }
    }
    return xs;
}

export function canonical_path(path: string) {
    const home = Deno.env.get('HOME')!;
    const xdg_config_home = Deno.env.get('XDG_CONFIG_HOME')!;
    path = path.replace('$XDG_CONFIG_HOME', xdg_config_home);
    path = path.replace('$HOME', home);
    return path;
}

function io_exists(path: string) {
    try {
        const fi = Deno.statSync(path);
        return fi;
    }
    catch (e) {
        return undefined;
    }
}

function io_dir_exists(path: string) {
    const x = io_exists(path);
    return x && x.isDirectory;
}

export function io_file_exists(path: string) {
    const x = io_exists(path);
    return x && x.isFile;
}

function io_prepare_path(path: string) {
    let dir = canonical_path(path);
    const n = dir.lastIndexOf('/');
    if (n >= 0) {
        dir = dir.substring(0, n);
    }

    if (io_exists(dir)) {
        if (!io_dir_exists(dir)) throw new Error(`${dir} is not a directory`);
    }
    else {
        Deno.mkdirSync(dir, {recursive: true});
    }
}

function io_get_file_name(path: string) {
    return path.substring(path.lastIndexOf('/')+1);
}

export function io_get_file_name_part(path: string) {
    const xs = io_get_file_name(path).split('.');
    if (xs.length > 1) {
        return xs.slice(0, xs.length-1).join('.');
    }
    else {
        return path;
    }
}

export function io_file_cp(source: string, dest: string) {
    source = canonical_path(source);
    dest = canonical_path(dest);
    io_prepare_path(dest);
    Deno.copyFileSync(source, dest);
}

function io_ls(path: string) {
    return Array.from(Deno.readDirSync(path)).map(x => x.name);
}

export function io_file_ls(path: string) {
    return Array.from(Deno.readDirSync(path)).filter(x => x.isFile).map(x => x.name);
}

export function io_dir_ls(path: string) {
    return Array.from(Deno.readDirSync(path)).filter(x => x.isDirectory).map(x => x.name);
}

export function io_read_text(path: string) {
    path = canonical_path(path);
    return Deno.readTextFileSync(path);
}

export function io_write_text(path: string, data: string) {
    io_prepare_path(path);
    path = canonical_path(path);
    return Deno.writeTextFileSync(path, data);
}

export function io_read_text_as_list(path: string) {
    return io_read_text(path).split('\n');
}

export function io_write_text_as_list(path: string, data: string[]) {
    io_write_text(path, data.join('\n'));
}

export function exec(cwd: string, cmd: string[]) {
    Deno.run({
        cwd: cwd,
        cmd: cmd
    });
}