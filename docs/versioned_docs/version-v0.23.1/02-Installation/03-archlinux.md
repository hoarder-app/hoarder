# Arch Linux

## Installation

> [Karakeep on AUR](https://aur.archlinux.org/packages/karakeep) is not maintained by the karakeep official.

1. Install karakeep

    ```shell
    paru -S karakeep
    ```

2. (**Optional**) Install optional dependencies

    ```shell
    # meilisearch: for full text search
    paru -S meilisearch

    # ollama: for automatic tagging
    paru -S ollama

    # karakeep-cli: karakeep cli tool
    paru -S karakeep-cli
    ```

    You can use Open-AI instead of `ollama`. If you use `ollama`, you need to download the ollama model. Please refer to: [https://ollama.com/library](https://ollama.com/library).

3. Set up

    Environment variables can be set in `/etc/karakeep/karakeep.env` according to [configuration page](/configuration). **The environment variables that are not specified in `/etc/karakeep/karakeep.env` need to be added by yourself.**

4. Enable service

    ```shell
    sudo systemctl enable --now karakeep.target
    ```

    Then visit `http://localhost:3000` and you should be greated with the Sign In page.

## Services and Ports

`karakeep.target` include 3 services: `karakeep-web.service`, `karakeep-works.service`, `karakeep-browser.service`. 

- `karakeep-web.service`: Provide karakeep WebUI service, use `3000` port default.

- `karakeep-works.service`: Provide karakeep works service, no port.

- `karakeep-browser.service`: Provide browser headless service, use `9222` port default.
