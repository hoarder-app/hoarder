import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/server/api/client";

import AddApiKey from "./AddApiKey";
import DeleteApiKey from "./DeleteApiKey";

export default async function ApiKeys() {
  const keys = await api.apiKeys.list();
  return (
    <div className="pt-4">
      <span className="text-xl">API Keys</span>
      <Separator className="my-2" />
      <div className="flex flex-col space-y-3">
        <div className="flex flex-1 justify-end">
          <AddApiKey />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell>{k.name}</TableCell>
                <TableCell>**_{k.keyId}_**</TableCell>
                <TableCell>{k.createdAt.toLocaleString()}</TableCell>
                <TableCell>
                  <DeleteApiKey name={k.name} id={k.id} />
                </TableCell>
              </TableRow>
            ))}
            <TableRow></TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
