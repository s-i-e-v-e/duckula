/*
 * Copyright (c) 2022 Sieve
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
const read = (file: string) => Deno.readTextFileSync(file);
const println = console.log;

function version() {
	println('duckula 0.1');
	println('Copyright (C) 2022 Sieve (https://github.com/s-i-e-v-e)');
	println('This is free software; see the source for copying conditions.  There is NO');
	println('warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.');
}

function help() {
	version();
	println('Usage:');
	println('help,    --help,          Display this information.');
	println('version, --version        Display version information.');
	println('theme apply               Apply theme');
}

export function main(args: string[]) {
	const cmd = args[0];
	switch(cmd) {
		case "--version":
		case "version": version(); break;
		case "--help":
		case "help":
		default: help(); break;
	}
}

if (import.meta.main) main(Deno.args);