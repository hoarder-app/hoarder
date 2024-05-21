import { AIProviderSelector } from "@/components/admin/AIProviderSelector";
import { ActionButton } from "@/components/ui/action-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Undo } from "lucide-react";
import { useForm, useFormContext } from "react-hook-form";

import {
  AI_PROVIDERS,
  aiConfigSchema,
  aiConfigSchemaType,
} from "@hoarder/shared/types/admin";

function OpenAiConfigSection() {
  const { control } = useFormContext<aiConfigSchemaType>();

  return (
    <>
      <TableRow>
        <TableCell className="lg:w-1/3">OpenAI Base URL</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="OpenAI.baseURL"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="url" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="lg:w-1/3">OpenAI API key</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="OpenAI.apiKey"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="text" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="lg:w-1/3">Inference Text Model</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="OpenAI.inferenceTextModel"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="text" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Inference Image Model</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="OpenAI.inferenceImageModel"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="text" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Inference Language</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="OpenAI.inferenceLanguage"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="text" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
    </>
  );
}

function OllamaConfigSection() {
  const { control } = useFormContext<aiConfigSchemaType>();

  return (
    <>
      <TableRow>
        <TableCell className="lg:w-1/3">Ollama Base URL</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="Ollama.baseURL"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="url" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="lg:w-1/3">Inference Text Model</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="Ollama.inferenceTextModel"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="text" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Inference Image Model</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="Ollama.inferenceImageModel"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="text" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Inference Language</TableCell>
        <TableCell>
          <FormField
            control={control}
            name="Ollama.inferenceLanguage"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input type="text" {...field} className="w-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </TableCell>
      </TableRow>
    </>
  );
}

function AiConfigurationSection(aiConfig: aiConfigSchemaType) {
  const form = useForm<aiConfigSchemaType>({
    values: aiConfig,
    resolver: zodResolver(aiConfigSchema),
  });

  function cleanState() {
    const state = form.getValues();

    console.log(state);
    switch (state.aiProvider) {
      case AI_PROVIDERS.OPEN_AI:
        form.reset({ ...form.getValues(), aiProvider: AI_PROVIDERS.OPEN_AI });
        break;
      case AI_PROVIDERS.OLLAMA:
        form.reset({ ...form.getValues(), aiProvider: AI_PROVIDERS.OLLAMA });
        break;
    }
  }

  const selectedAiProvider = form.watch("aiProvider");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (_value) => {
          console.log("hier", _value);
          // TODO submit form
        })}
      >
        <p className="text-xl">AI Configuration</p>
        <Table className="lg:w-1/2">
          <TableBody>
            <TableRow>
              <TableCell>AI Provider</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="aiProvider"
                  render={({ field }) => {
                    return (
                      <AIProviderSelector
                        value={field.value}
                        options={Object.values(AI_PROVIDERS)}
                        onChange={(e) => {
                          field.onChange(e);
                          cleanState();
                        }}
                      ></AIProviderSelector>
                    );
                  }}
                />
              </TableCell>
            </TableRow>
            {selectedAiProvider === AI_PROVIDERS.OPEN_AI && (
              <OpenAiConfigSection />
            )}
            {selectedAiProvider === AI_PROVIDERS.OLLAMA && (
              <OllamaConfigSection />
            )}
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

export function AiConfigurationTab(aiConfig: aiConfigSchemaType) {
  return (
    <>
      <AiConfigurationSection {...aiConfig} />
    </>
  );
}
