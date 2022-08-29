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