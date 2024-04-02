# Command Line Tool (CLI)

Hoarder comes with a simple CLI for those users who want to do more advanced manipulation. Currently, the CLI comes packaged as a docker container. You can run it with:

```
docker run --rm ghcr.io/mohamedbassem/hoarder-cli --help
```

To use the CLI, you'll need to get an API key from your hoarder settings. You can validate that it's working by running:

```
docker run --rm ghcr.io/mohamedbassem/hoarder-cli --api-key <key> --server-addr <addr> whoami
```

For example:

```
docker run --rm ghcr.io/mohamedbassem/hoarder-cli --api-key mysupersecretkey --server-addr https://try.hoarder.app whoami
{
  id: 'j29gnbzxxd01q74j2lu88tnb',
  name: 'Test User',
  email: 'test@gmail.com'
}
```

Check the help for the other available commands, but the main usecase for the CLI is to enable mass manipulation of your bookmarks. E.g. mass importing of bookmarks, mass deletions, etc.
