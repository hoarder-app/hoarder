import { Command } from "@commander-js/extra-typings";
import { getAPIClient } from "lib/trpc";
import { getBorderCharacters, table } from "table";

export const tagsCmd = new Command()
  .name("tags")
  .description("Manipulating tags");

tagsCmd
  .command("list")
  .description("Lists all tags")
  .action(async () => {
    const api = getAPIClient();

    const tags = (await api.tags.list.query()).tags;
    tags.sort((a, b) => b.count - a.count);

    const data: string[][] = [["Id", "Name", "Num bookmarks"]];

    tags.forEach((tag) => {
      data.push([tag.id, tag.name, tag.count.toString()]);
    });
    console.log(
      table(data, { border: getBorderCharacters("ramac"), singleLine: true }),
    );
  });

tagsCmd
  .command("delete")
  .description("Delete a tag")
  .argument("<id>", "The id of the tag")
  .action(async (id) => {
    const api = getAPIClient();

    await api.tags.delete.mutate({
      tagId: id,
    });

    console.log("Successfully delete the tag with id:", id);
  });
