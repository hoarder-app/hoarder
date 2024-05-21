import { ActionButton } from "@/components/ui/action-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Undo } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  crawlerConfigSchema,
  crawlerConfigSchemaType,
} from "@hoarder/shared/types/admin";

function CrawlerConfigurationSection(crawlerConfig: crawlerConfigSchemaType) {
  const form = useForm<crawlerConfigSchemaType>({
    values: crawlerConfig,
    resolver: zodResolver(crawlerConfigSchema),
  });
  const { mutate: updateCrawlerConfigMutator } =
    api.admin.updateConfig.useMutation({
      onSuccess: () => {
        toast({
          description: "Config updated!",
        });
        form.reset(form.getValues());
      },
      onError: (error) => {
        toast({
          description: `Something went wrong: ${error.message}`,
          variant: "destructive",
        });
      },
    });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (value) => {
          updateCrawlerConfigMutator({
            crawlerConfig: value,
          });
        })}
      >
        <p className="text-xl">Crawler Configuration</p>
        <Table className="lg:w-1/2">
          <TableBody>
            <TableRow>
              <TableCell>Download Banner Image</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="downloadBannerImage"
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
              <TableCell>Store Screenshot</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="storeScreenshot"
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
              <TableCell>Store full page Screenshot</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="storeFullPageScreenshot"
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
              <TableCell>Job Timeout (sec)</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="jobTimeout"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormControl>
                          <Input type="number" {...field} className="w-25" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Navigate Timeout (sec)</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="navigateTimeout"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormControl>
                          <Input type="number" {...field} className="w-25" />
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

export function CrawlerConfigurationTab(
  crawlerConfig: crawlerConfigSchemaType,
) {
  return (
    <>
      <CrawlerConfigurationSection {...crawlerConfig} />
    </>
  );
}
