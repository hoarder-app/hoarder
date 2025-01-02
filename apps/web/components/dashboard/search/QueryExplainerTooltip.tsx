import InfoTooltip from "@/components/ui/info-tooltip";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { TextAndMatcher } from "@hoarder/shared/searchQueryParser";
import { Matcher } from "@hoarder/shared/types/search";

export default function QueryExplainerTooltip({
  parsedSearchQuery,
  header,
  className,
}: {
  header?: React.ReactNode;
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
            <TableCell>
              {matcher.inverse ? "Doesn't have" : "Has"} Tag
            </TableCell>
            <TableCell>{matcher.tagName}</TableCell>
          </TableRow>
        );
      case "listName":
        return (
          <TableRow>
            <TableCell>
              {matcher.inverse ? "Is not in" : "Is in "} List
            </TableCell>
            <TableCell>{matcher.listName}</TableCell>
          </TableRow>
        );
      case "dateAfter":
        return (
          <TableRow>
            <TableCell>{matcher.inverse ? "Not" : ""} Created After</TableCell>
            <TableCell>{matcher.dateAfter.toDateString()}</TableCell>
          </TableRow>
        );
      case "dateBefore":
        return (
          <TableRow>
            <TableCell>{matcher.inverse ? "Not" : ""} Created Before</TableCell>
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
      case "tagged":
        return (
          <TableRow>
            <TableCell>Has Tags</TableCell>
            <TableCell>{matcher.tagged.toString()}</TableCell>
          </TableRow>
        );
      case "inlist":
        return (
          <TableRow>
            <TableCell>In Any List</TableCell>
            <TableCell>{matcher.inList.toString()}</TableCell>
          </TableRow>
        );
      case "and":
      case "or":
        return (
          <TableRow>
            <TableCell className="capitalize">{matcher.type}</TableCell>
            <TableCell>
              <Table>
                <TableBody>
                  {matcher.matchers.map((m, i) => (
                    <MatcherComp key={i} matcher={m} />
                  ))}
                </TableBody>
              </Table>
            </TableCell>
          </TableRow>
        );
    }
  };

  return (
    <InfoTooltip className={className}>
      {header}
      <Table>
        <TableBody>
          {parsedSearchQuery.text && (
            <TableRow>
              <TableCell>Text</TableCell>
              <TableCell>{parsedSearchQuery.text}</TableCell>
            </TableRow>
          )}
          {parsedSearchQuery.matcher && (
            <MatcherComp matcher={parsedSearchQuery.matcher} />
          )}
        </TableBody>
      </Table>
    </InfoTooltip>
  );
}
