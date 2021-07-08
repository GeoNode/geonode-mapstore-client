#!/bin/bash
set -e

do_npx=0
do_clean_cache=0
do_update=0
do_npm_install=1
do_npm_install_force=0
do_yarn_install=0
do_lint=0
while getopts "xcufnyl" opt
do
    case $opt in
    (x) do_npx=1 ;;
    (c) do_clean_cache=1 ;;
    (u) do_update=1 ;;
    (f) do_yarn_install=0 ; do_npm_install_force=1 ; do_npm_install=0 ;;
    (n) do_yarn_install=0 ; do_npm_install_force=0 ; do_npm_install=1 ;;
    (y) do_yarn_install=1 ; do_npm_install_force=0 ; do_npm_install=0 ;;
    (l) do_lint=1 ;;
    (*) printf "Illegal option '-%s'\n" "$opt" && printf "Example usage: ./build.sh -uyl\n  Options:\n\t(x) Cleans node_modules\n\t(c) Cleans npm cache\n\t(u) Runs npn update\n\t(f) Runs npm install --force\n\t(n) Uses npm install instead of yarn\n\t(y) Uses yarn install instead of npm\n\t(l) Runs lint\n" && exit 1 ;;
    esac
done

(( do_npx )) && printf " - Cleaning node_modules...\n" && rm package-lock.json && npx rimraf package-lock.json npm-shrinkwrap.json node_modules
(( do_clean_cache )) && printf " - Cleaning npm cache...\n" && npm cache clean --force && sudo npm install -g npm@latest --force && npm cache clean --force
(( do_update )) && printf " - Executing npm update...\n" && npm update
(( do_npm_install )) && printf " - Executing npm install...\n" && npm install
(( do_npm_install_force )) && printf " - Forcing npm install...\n" && npm install --force
(( do_yarn_install )) && printf " - Executing yarn update...\n" && yarn install
printf " - Executing npm run compile...\n" && npm run compile
(( do_lint )) && printf " - Executing npm run lint...\n" && npm run lint
