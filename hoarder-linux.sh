#!/usr/bin/env bash

set -Eeuo pipefail

# v2.0
# Copyright 2024-2025
# Author: vhsdream
# Adapted from: The Hoarder installation script from https://github.com/community-scripts/ProxmoxVE
# License: MIT

# Basic error handling
trap 'catch $? $LINENO' ERR

catch() {
    if [ "$1" == 0 ]; then
        return
    fi
    echo "Caught error $1 on line $2"
}

OS="$( awk -F'=' '/^VERSION_CODENAME=/{ print $NF }' /etc/os-release )"
INSTALL_DIR=/opt/hoarder
export DATA_DIR=/var/lib/hoarder
CONFIG_DIR=/etc/hoarder
LOG_DIR=/var/log/hoarder
ENV_FILE=${CONFIG_DIR}/hoarder.env

install() {
  echo "Hoarder installation for Debian 12/Ubuntu 24.04" && sleep 4
  echo "Installing Dependencies..." && sleep 1
  apt-get install --no-install-recommends -y \
    g++ \
    curl \
    build-essential \
    curl \
    sudo \
    unzip \
    gnupg \
    ca-certificates
  if [[ "$OS" == "noble" ]]; then
    apt-get install -y software-properties-common
    add-apt-repository ppa:xtradeb/apps -y
    apt-get install --no-install-recommends -y ungoogled-chromium yt-dlp
    ln -s /usr/bin/ungoogled-chromium /usr/bin/chromium
  else
    apt-get install --no-install-recommends -y chromium
    wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -O /usr/bin/yt-dlp && chmod +x /usr/bin/yt-dlp
  fi

  wget -q https://github.com/Y2Z/monolith/releases/latest/download/monolith-gnu-linux-x86_64 -O /usr/bin/monolith && chmod +x /usr/bin/monolith
  wget -q https://github.com/meilisearch/meilisearch/releases/latest/download/meilisearch.deb && \
    DEBIAN_FRONTEND=noninteractive dpkg -i meilisearch.deb  && rm meilisearch.deb
  echo "Installed Dependencies" && sleep 1

  echo "Installing Node.js..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
  # https://github.com/hoarder-app/hoarder/issues/967
  npm install -g corepack@0.31.0
  echo "Installed Node.js" && sleep 1

  echo "Installing Hoarder..."
  mkdir -p $DATA_DIR
  mkdir -p $CONFIG_DIR
  mkdir -p $LOG_DIR
  M_DATA_DIR=/var/lib/meilisearch
  M_CONFIG_FILE=/etc/meilisearch.toml
  RELEASE=$(curl -s https://api.github.com/repos/hoarder-app/hoarder/releases/latest | grep "tag_name" | awk '{print substr($2, 3, length($2)-4) }')
  cd /tmp
  wget -q "https://github.com/hoarder-app/hoarder/archive/refs/tags/v${RELEASE}.zip"
  unzip -q v${RELEASE}.zip
  mv hoarder-${RELEASE} ${INSTALL_DIR} && cd ${INSTALL_DIR}/apps/web
  corepack enable
  export NEXT_TELEMETRY_DISABLED=1
  export PUPPETEER_SKIP_DOWNLOAD="true"
  export CI="true"
  pnpm i --frozen-lockfile
  pnpm exec next build --experimental-build-mode compile
  cd ${INSTALL_DIR}/apps/workers
  pnpm i --frozen-lockfile
  cd ${INSTALL_DIR}/apps/cli
  pnpm i --frozen-lockfile
  pnpm build
  cd ${INSTALL_DIR}/packages/db
  pnpm migrate
  echo "Installed Hoarder" && sleep 1

  echo "Creating configuration files..."
  cd $INSTALL_DIR
  MASTER_KEY="$(openssl rand -base64 12)"
  cat <<EOF >${M_CONFIG_FILE}
env = "production"
master_key = "$MASTER_KEY"
db_path = "${M_DATA_DIR}/data"
dump_dir = "${M_DATA_DIR}/dumps"
snapshot_dir = "${M_DATA_DIR}/snapshots"
no_analytics = true
EOF
  chmod 600 $M_CONFIG_FILE

  HOARDER_SECRET="$(openssl rand -base64 36 | cut -c1-24)"
  cat <<EOF >${ENV_FILE}
NODE_ENV=production
SERVER_VERSION=${RELEASE}
NEXTAUTH_SECRET="${HOARDER_SECRET}"
NEXTAUTH_URL="http://localhost:3000"
DATA_DIR=${DATA_DIR}
MEILI_ADDR="http://127.0.0.1:7700"
MEILI_MASTER_KEY="${MASTER_KEY}"
BROWSER_WEB_URL="http://127.0.0.1:9222"
# CRAWLER_VIDEO_DOWNLOAD=true
# CRAWLER_VIDEO_DOWNLOAD_MAX_SIZE=
# OPENAI_API_KEY=
# OLLAMA_BASE_URL=
# INFERENCE_TEXT_MODEL=
# INFERENCE_IMAGE_MODEL=
EOF
  chmod 600 $ENV_FILE
  echo ${RELEASE} > ${INSTALL_DIR}/version.txt
  echo "Configuration complete" && sleep 1

  echo "Creating users and modifying permissions..."
  useradd -U -s /usr/sbin/nologin -r -m -d "${M_DATA_DIR}" meilisearch
  useradd -U -s /usr/sbin/nologin -r -M -d "${INSTALL_DIR}" hoarder
  chown meilisearch:meilisearch "${M_CONFIG_FILE}"
  chown -R hoarder:hoarder "${INSTALL_DIR}" "${CONFIG_DIR}" "${DATA_DIR}" "${LOG_DIR}"
  echo "Users created, permissions modified" && sleep 1

  echo "Creating service files..."
  cat <<EOF >/etc/systemd/system/meilisearch.service
[Unit]
Description=MeiliSearch is a RESTful search API
Documentation=https://docs.meilisearch.com/
After=network.target

[Service]
User=meilisearch
Group=meilisearch
Restart=on-failure
WorkingDirectory=${M_DATA_DIR}
ExecStart=/usr/bin/meilisearch --config-file-path ${M_CONFIG_FILE}
NoNewPrivileges=true
ProtectHome=true
ReadWritePaths=${M_DATA_DIR}
ProtectSystem=full
ProtectHostname=true
ProtectControlGroups=true
ProtectKernelModules=true
ProtectKernelTunables=true
ProtectKernelLogs=true
ProtectClock=true
LockPersonality=true
RestrictRealtime=yes
RestrictNamespaces=yes
MemoryDenyWriteExecute=yes
PrivateDevices=yes
PrivateTmp=true
CapabilityBoundingSet=
RemoveIPC=true

[Install]
WantedBy=multi-user.target
EOF

  cat <<EOF >/etc/systemd/system/hoarder-browser.service
[Unit]
Description=Hoarder headless browser
After=network.target

[Service]
User=root
Restart=on-failure
ExecStart=/usr/bin/chromium --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --hide-scrollbars
TimeoutStopSec=5
SyslogIdentifier=hoarder-browser

[Install]
WantedBy=multi-user.target
EOF

  cat <<EOF >/etc/systemd/system/hoarder-workers.service
[Unit]
Description=Hoarder workers
Wants=network.target hoarder-browser.service meilisearch.service
After=network.target hoarder-browser.service meilisearch.service

[Service]
User=hoarder
Group=hoarder
Restart=always
EnvironmentFile=${ENV_FILE}
WorkingDirectory=${INSTALL_DIR}/apps/workers
ExecStart=/usr/bin/pnpm run start:prod
StandardOutput=file:${LOG_DIR}/hoarder-workers.log
StandardError=file:${LOG_DIR}/hoarder-workers.log
TimeoutStopSec=5
SyslogIdentifier=hoarder-workers

[Install]
WantedBy=multi-user.target
EOF

  cat <<EOF >/etc/systemd/system/hoarder-web.service
[Unit]
Description=Hoarder web
Wants=network.target hoarder-workers.service
After=network.target hoarder-workers.service

[Service]
User=hoarder
Group=hoarder
Restart=on-failure
EnvironmentFile=${ENV_FILE}
WorkingDirectory=${INSTALL_DIR}/apps/web
ExecStart=/usr/bin/pnpm start
StandardOutput=file:${LOG_DIR}/hoarder-web.log
StandardError=file:${LOG_DIR}/hoarder-web.log
TimeoutStopSec=5
SyslogIdentifier=hoarder-web

[Install]
WantedBy=multi-user.target
EOF

  cat <<EOF >/etc/systemd/system/hoarder.target
[Unit]
Description=Hoarder Services
After=network-online.target
Wants=meilisearch.service hoarder-browser.service hoarder-workers.service hoarder-web.service

[Install]
WantedBy=multi-user.target
EOF
  echo "Service files created" && sleep 1

  echo "Enabling and starting services, please wait..." && sleep 3
  systemctl enable -q --now meilisearch.service hoarder.target
  echo "Done" && sleep 1

  echo "Cleaning up" && sleep 1
  rm /tmp/v${RELEASE}.zip
  apt -y autoremove
  apt -y autoclean
  echo "Cleaned" && sleep 1

  echo "OK, Hoarder should be accessible on port 3000 of this device's IP address!" && sleep 4
  exit 0
}

update() {
  echo "Checking for an update..." && sleep 1
  if [[ ! -d ${INSTALL_DIR} ]]; then echo "Is Hoarder even installed?"; exit 1; fi
  RELEASE=$(curl -s https://api.github.com/repos/hoarder-app/hoarder/releases/latest | grep "tag_name" | awk '{print substr($2, 3, length($2)-4) }')
  PREV_RELEASE=$(cat ${INSTALL_DIR}/version.txt)
  if [[ "${RELEASE}" != "${PREV_RELEASE}" ]]; then
    echo "Stopping affected services..." && sleep 1
    systemctl stop hoarder-web hoarder-workers
    echo "Stopped services" && sleep 1

    echo "Updating Hoarder to v${RELEASE}..." && sleep 1
    sed -i "s|SERVER_VERSION=${PREV_RELEASE}|SERVER_VERSION=${RELEASE}|" ${ENV_FILE}
    rm -R ${INSTALL_DIR}
    cd /tmp
    wget -q "https://github.com/hoarder-app/hoarder/archive/refs/tags/v${RELEASE}.zip"
    unzip -q v${RELEASE}.zip
    mv hoarder-${RELEASE} ${INSTALL_DIR}
    # https://github.com/hoarder-app/hoarder/issues/967
    if [[ $(corepack -v) < "0.31.0" ]]; then
        npm install -g corepack@0.31.0
    fi
    cd ${INSTALL_DIR}/apps/web && pnpm i --frozen-lockfile
    pnpm exec next build --experimental-build-mode compile
    cd ${INSTALL_DIR}/apps/workers && pnpm i --frozen-lockfile
    cd ${INSTALL_DIR}/apps/cli && pnpm i --frozen-lockfile
    pnpm build
    cd ${INSTALL_DIR}/packages/db && pnpm migrate
    echo "${RELEASE}" >${INSTALL_DIR}/version.txt
    chown -R hoarder:hoarder ${INSTALL_DIR} ${DATA_DIR}
    echo "Updated Hoarder to v${RELEASE}" && sleep 1
    echo "Restarting services and cleaning up..." && sleep 1
    systemctl start hoarder-workers hoarder-web
    rm /tmp/v${RELEASE}.zip
    echo "Ready!"
  else
    echo "No update required."
  fi
  exit 0
}

[ "$(id -u)" -ne 0 ] && echo "This script requires root privileges. Please run with sudo or as the root user." && exit 1
command="${1:-}"
if [ -z "$command" ]; then
    echo -e "Run script with 'install' to install Hoarder and 'update' to update Hoarder" && exit 1
fi

case "$command" in
    install)
        install
        ;;
    update)
        update
        ;;
    *)
        echo -e "Unknown command. Choose 'install' or 'update'" && exit 1
esac
