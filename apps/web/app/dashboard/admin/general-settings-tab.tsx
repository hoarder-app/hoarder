import { ActionButton } from "@/components/ui/action-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Trash, Undo } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import {
  generalSettingsSchema,
  generalSettingsSchemaType,
} from "@hoarder/shared/types/admin";

function UsersSection() {
  const { data: session } = useSession();
  const invalidateUserList = api.useUtils().users.list.invalidate;
  const { data: users } = api.users.list.useQuery();
  const { mutate: deleteUser, isPending: isDeletionPending } =
    api.users.delete.useMutation({
      onSuccess: () => {
        toast({
          description: "User deleted",
        });
        invalidateUserList();
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: `Something went wrong: ${e.message}`,
        });
      },
    });

  if (!users) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <p className="text-xl">Users</p>
      <Table>
        <TableHeader>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Action</TableHead>
        </TableHeader>
        <TableBody>
          {users.users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>
                <ActionButton
                  variant="destructive"
                  onClick={() => deleteUser({ userId: u.id })}
                  loading={isDeletionPending}
                  disabled={session!.user.id == u.id}
                >
                  <Trash />
                </ActionButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function GeneralSettingsSection(generalSettings: generalSettingsSchemaType) {
  const form = useForm<generalSettingsSchemaType>({
    values: generalSettings,
    resolver: zodResolver(generalSettingsSchema),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (_value) => {
          console.log("hier", _value);
        })}
      >
        <p className="text-xl">General Settings</p>
        <Table className="lg:w-1/2">
          <TableBody>
            <TableRow>
              <TableCell className="lg:w-1/3">Disable Signups</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="disableSignups"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Maximum Asset Size (MB)</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="maxAssetSize"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormControl>
                          <Input type="number" {...field} className="w-20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Disable new release check</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="disableNewReleaseCheck"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>
                <ActionButton
                  disabled={!form.formState.isDirty}
                  variant="default"
                  type="reset"
                  loading={form.formState.isSubmitting}
                  className="m-2"
                  onClick={() => {
                    form.reset();
                  }}
                >
                  <Undo className="size-7 pr-2" />
                  Reset
                </ActionButton>
                <ActionButton
                  disabled={!form.formState.isDirty}
                  variant={form.formState.isDirty ? "destructive" : "default"}
                  type="submit"
                  loading={form.formState.isSubmitting}
                >
                  <Save className="size-7 pr-2" />
                  Save
                </ActionButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </form>
    </Form>
  );
}

function ActionsSection() {
  const { mutate: recrawlLinks, isPending: isRecrawlPending } =
    api.admin.recrawlLinks.useMutation({
      onSuccess: () => {
        toast({
          description: "Recrawl enqueued",
        });
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: e.message,
        });
      },
    });

  const { mutate: reindexBookmarks, isPending: isReindexPending } =
    api.admin.reindexAllBookmarks.useMutation({
      onSuccess: () => {
        toast({
          description: "Reindex enqueued",
        });
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: e.message,
        });
      },
    });

  return (
    <>
      <p className="text-xl">Actions</p>
      <ActionButton
        className="lg:w-1/2"
        variant="destructive"
        loading={isRecrawlPending}
        onClick={() =>
          recrawlLinks({ crawlStatus: "failure", runInference: true })
        }
      >
        Recrawl Failed Links Only
      </ActionButton>
      <ActionButton
        className="lg:w-1/2"
        variant="destructive"
        loading={isRecrawlPending}
        onClick={() => recrawlLinks({ crawlStatus: "all", runInference: true })}
      >
        Recrawl All Links
      </ActionButton>
      <ActionButton
        className="lg:w-1/2"
        variant="destructive"
        loading={isRecrawlPending}
        onClick={() =>
          recrawlLinks({ crawlStatus: "all", runInference: false })
        }
      >
        Recrawl All Links (Without Inference)
      </ActionButton>
      <ActionButton
        className="lg:w-1/2"
        variant="destructive"
        loading={isReindexPending}
        onClick={() => reindexBookmarks()}
      >
        Reindex All Bookmarks
      </ActionButton>
    </>
  );
}

export function GeneralTab(generalSettings: generalSettingsSchemaType) {
  return (
    <>
      <GeneralSettingsSection {...generalSettings} />
      <Separator />
      <UsersSection />
      <Separator />
      <ActionsSection />
    </>
  );
}
