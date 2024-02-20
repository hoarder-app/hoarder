#!/bin/sh

set -x;
id -u chrome &>/dev/null || adduser -S chrome;
mkdir -p $BROWSER_USER_DATA_DIR;
chown chrome $BROWSER_USER_DATA_DIR;
runuser -u chrome -- $CHROME_PATH --no-sandbox $@;
