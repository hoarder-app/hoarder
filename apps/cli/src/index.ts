#! /usr/bin/env node
import { bookmarkCmd } from "@/commands/bookmarks";
import { listsCmd } from "@/commands/lists";
import { tagsCmd } from "@/commands/tags";
import { whoamiCmd } from "@/commands/whoami";
import { setGlobalOptions } from "@/lib/globals";
import { Command, Option } from "@commander-js/extra-typings";

const program = new Command()
  .name("hoarder")
  .description("A CLI interface to interact with the hoarder api")
  .addOption(
    new Option("--api-key <key>", "the API key to interact with the API")
      .makeOptionMandatory(true)
      .env("HOARDER_API_KEY"),
  )
  .addOption(
    new Option(
      "--server-addr <addr>",
      "the address of the server to connect to",
    )
      .makeOptionMandatory(true)
      .env("HOARDER_SERVER_ADDR"),
  )
  .version(process.env.npm_package_version ?? "0.0.0");

program.addCommand(bookmarkCmd);
program.addCommand(listsCmd);
program.addCommand(tagsCmd);
program.addCommand(whoamiCmd);

setGlobalOptions(program.opts());

program.parse();
