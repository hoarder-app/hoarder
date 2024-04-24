import { getAPIClient } from "@/lib/trpc";
import { Command } from "@commander-js/extra-typings";
import { getBorderCharacters, table } from "table";

import { listsToTree } from "@hoarder/shared/utils/listUtils";

export const listsCmd = new Command()
  .name("lists")
  .description("manipulating lists");

listsCmd
  .command("list")
  .description("lists all lists")
  .action(async () => {
    const api = getAPIClient();

    const resp = await api.lists.list.query();
    const { allPaths } = listsToTree(resp.lists);

    const data: string[][] = [["Id", "Name"]];

    allPaths.forEach((path) => {
      const name = path.map((p) => `${p.icon} ${p.name}`).join(" / ");
      const id = path[path.length - 1].id;
      data.push([id, name]);
    });
    console.log(
      table(data, { border: getBorderCharacters("ramac"), singleLine: true }),
    );
  });

listsCmd
  .command("delete")
  .description("deletes a list")
  .argument("<id>", "the id of the list")
  .action(async (id) => {
    const api = getAPIClient();

    await api.lists.delete.mutate({
      listId: id,
    });
    console.log("Successfully deleted list with id:", id);
  });

listsCmd
  .command("add-bookmark")
  .description("add a bookmark to list")
  .requiredOption("--list <id>", "the id of the list")
  .requiredOption("--bookmark <bookmark>", "the id of the bookmark")
  .action(async (opts) => {
    const api = getAPIClient();

    await api.lists.addToList.mutate({
      listId: opts.list,
      bookmarkId: opts.bookmark,
    });
    console.log("Successfully added bookmark from list");
  });

listsCmd
  .command("remove-bookmark")
  .description("remove a bookmark from list")
  .requiredOption("--list <id>", "the id of the list")
  .requiredOption("--bookmark <bookmark>", "the id of the bookmark")
  .action(async (opts) => {
    const api = getAPIClient();

    await api.lists.removeFromList.mutate({
      listId: opts.list,
      bookmarkId: opts.bookmark,
    });

    console.log("Successfully removed bookmark from list");
  });
