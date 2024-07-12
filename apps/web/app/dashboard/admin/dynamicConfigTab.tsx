import { ActionButton } from "@/components/ui/action-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Undo } from "lucide-react";
import {
  ControllerRenderProps,
  FieldValues,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

import {
  ConfigKeys,
  ConfigSectionName,
  SectionSymbol,
  serverConfig,
} from "@hoarder/db/config/config";
import { getConfigSchema } from "@hoarder/db/config/configSchemaUtils";
import {
  ConfigType,
  ConfigTypes,
  ConfigValue,
  InferenceProviderEnum,
} from "@hoarder/db/config/configValue";

export function DynamicConfigTab<T extends ConfigSectionName>({
  onSave,
  configSectionName,
  config,
}: {
  onSave: () => void;
  configSectionName: T;
  config?: Record<ConfigKeys, ConfigTypes>;
}) {
  const configSchema = getConfigSchema(configSectionName);
  const form = useForm<z.infer<typeof configSchema>>({
    values: config,
    resolver: zodResolver(configSchema),
  });

  const { mutate: storeConfig } = api.admin.storeConfig.useMutation({
    onSuccess: () => {
      toast({
        description: "Config updated!",
      });
      form.reset(form.getValues());
      onSave();
    },
    onError: (error) => {
      toast({
        description: `Something went wrong: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (!config) {
    return (
      <TabsContent value={configSectionName}>
        <LoadingSpinner />
      </TabsContent>
    );
  }

  return (
    <TabsContent value={configSectionName}>
      <div className="flex flex-col gap-5 rounded-md border bg-background p-4">
        <div className="mb-2 text-xl font-medium">
          {serverConfig[configSectionName][SectionSymbol].name}
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (value) => {
              storeConfig({
                configSectionName,
                values: value as Record<ConfigKeys, ConfigTypes>,
              });
            })}
          >
            <Table>
              <TableBody>
                {Object.entries(serverConfig[configSectionName]).map(
                  ([key, value]) => createConfigValueUI(key, value, form),
                )}
                <TableRow>
                  <TableCell className="w-auto text-right"></TableCell>
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
                      variant={
                        form.formState.isDirty ? "destructive" : "default"
                      }
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
      </div>
    </TabsContent>
  );
}

const LOOKUP_TABLE = {
  [ConfigType.BOOLEAN]: createBooleanRow,
  [ConfigType.STRING]: createStringRow,
  [ConfigType.PASSWORD]: createPasswordRow,
  [ConfigType.URL]: createUrlRow,
  [ConfigType.NUMBER]: createNumberRow,
  [ConfigType.INFERENCE_PROVIDER_ENUM]: createInferenceProviderRow,
};

function createConfigValueUI(
  key: string,
  configValue: ConfigValue<ConfigType>,
  form: UseFormReturn<FieldValues>,
) {
  const values = form.getValues() as Record<ConfigKeys, ConfigTypes>;

  if (Array.isArray(configValue.validator)) {
    // Configs that have multiple schemas (=dropdowns) need to watch the form for changes to update the UI
    form.watch(key);
  }
  if (configValue.shouldRender(values)) {
    return (
      <TableRow>
        <TableCell className="w-auto text-right">{configValue.name}</TableCell>
        <TableCell className="text-left lg:w-4/5">
          <FormField
            control={form.control}
            name={key}
            render={({ field }) => LOOKUP_TABLE[configValue.type](field)}
          />
        </TableCell>
      </TableRow>
    );
  }
  return <></>;
}

function createBooleanRow(field: ControllerRenderProps<FieldValues, string>) {
  return (
    <FormItem>
      <FormControl>
        <Switch
          checked={field.value as boolean}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function createNumberRow(field: ControllerRenderProps<FieldValues, string>) {
  return (
    <FormItem>
      <FormControl>
        <Input type="number" {...field} className="w-25" min={0} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function createStringRow(field: ControllerRenderProps<FieldValues, string>) {
  return createInputRow("string", field);
}

function createPasswordRow(field: ControllerRenderProps<FieldValues, string>) {
  return createInputRow("password", field);
}

function createUrlRow(field: ControllerRenderProps<FieldValues, string>) {
  return createInputRow("url", field);
}

function createInputRow(
  type: string,
  field: ControllerRenderProps<FieldValues, string>,
) {
  return (
    <FormItem>
      <FormControl>
        <Input type={type} {...field} className="w-100" size={50} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function createInferenceProviderRow(
  field: ControllerRenderProps<FieldValues, string>,
) {
  const fieldValue = field.value as string;
  return (
    <Select
      onValueChange={(value) => {
        field.onChange(value);
      }}
      value={fieldValue}
    >
      <FormControl>
        <SelectTrigger className="w-fit">
          <SelectValue placeholder={fieldValue} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {Object.values(InferenceProviderEnum).map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
