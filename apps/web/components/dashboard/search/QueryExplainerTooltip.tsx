import InfoTooltip from "@/components/ui/info-tooltip";
import { Table, TableCell, TableRow } from "@/components/ui/table";

import { TextAndMatcher } from "@hoarder/shared/searchQueryParser";
import { Matcher } from "@hoarder/shared/types/search";

export default function QueryExplainerTooltip({
  parsedSearchQuery,
  className,
}: {
  parsedSearchQuery: TextAndMatcher & { result: string };
  className?: string;
}) {
  if (parsedSearchQuery.result == "invalid") {
    return null;
  }

  const MatcherComp = ({ matcher }: { matcher: Matcher }) => {
    switch (matcher.type) {
      case "tagName":
        return (
          <TableRow>
            <TableCell>Tag Name</TableCell>
            <TableCell>{matcher.tagName}</TableCell>
          </TableRow>
        );
      case "listName":
        return (
          <TableRow>
            <TableCell>List Name</TableCell>
            <TableCell>{matcher.listName}</TableCell>
          </TableRow>
        );
      case "dateAfter":
        return (
          <TableRow>
            <TableCell>Created After</TableCell>
            <TableCell>{matcher.dateAfter.toDateString()}</TableCell>
          </TableRow>
        );
      case "dateBefore":
        return (
          <TableRow>
            <TableCell>Created Before</TableCell>
            <TableCell>{matcher.dateBefore.toDateString()}</TableCell>
          </TableRow>
        );
      case "favourited":
        return (
          <TableRow>
            <TableCell>Favourited</TableCell>
            <TableCell>{matcher.favourited.toString()}</TableCell>
          </TableRow>
        );
      case "archived":
        return (
          <TableRow>
            <TableCell>Archived</TableCell>
            <TableCell>{matcher.archived.toString()}</TableCell>
          </TableRow>
        );
      case "and":
      case "or":
        return (
          <TableRow>
            <TableCell className="capitalize">{matcher.type}</TableCell>
            <TableCell>
              <Table>
                {matcher.matchers.map((m, i) => (
                  <MatcherComp key={i} matcher={m} />
                ))}
              </Table>
            </TableCell>
          </TableRow>
        );
    }
  };

  return (
    <InfoTooltip className={className}>
      <Table>
        {parsedSearchQuery.text && (
          <TableRow>
            <TableCell>Text</TableCell>
            <TableCell>{parsedSearchQuery.text}</TableCell>
          </TableRow>
        )}
        {parsedSearchQuery.matcher && (
          <MatcherComp matcher={parsedSearchQuery.matcher} />
        )}
      </Table>
    </InfoTooltip>
  );
}
