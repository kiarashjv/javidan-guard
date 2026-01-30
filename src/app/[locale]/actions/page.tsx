"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data-table/data-table";
import { api } from "@/lib/convex-api";
import { actionCreateSchema, actionFormSchema } from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";

export default function ActionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("actions");
  const table = useTranslations("table");
  const actions = useQuery(api.actions.listCurrent, {});
  const createAction = useMutation(api.actions.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const direction = locale === "fa" ? "rtl" : "ltr";
  const actionRows = useMemo(() => (actions ?? []) as ActionRow[], [actions]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof actionFormSchema>>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      actionType: "killing",
      date: "",
      location: "",
      description: "",
      perpetratorId: "",
      victimIds: "",
      evidenceUrls: "",
      videoLinks: "",
      documentLinks: "",
      witnessStatements: "",
      reason: "",
    },
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });

  async function handleEvidenceUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl({});
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error("Upload failed.");
        }

        const { storageId } = (await result.json()) as { storageId: string };
        const resolvedUrl = await getUploadUrl({ storageId });
        if (resolvedUrl) {
          uploadedUrls.push(resolvedUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        const existing = form.getValues("evidenceUrls").trim();
        const combined = existing.length
          ? `${existing}, ${uploadedUrls.join(", ")}`
          : uploadedUrls.join(", ");
        form.setValue("evidenceUrls", combined, { shouldDirty: true });
      }
      event.target.value = "";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(values: z.infer<typeof actionFormSchema>) {
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();

    const payload = {
      actionType: values.actionType as
        | "killing"
        | "torture"
        | "arrest"
        | "assault"
        | "other",
      date: values.date.trim(),
      location: values.location.trim(),
      description: values.description.trim(),
      perpetratorId: values.perpetratorId.trim(),
      victimIds: values.victimIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      evidenceUrls: values.evidenceUrls
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      videoLinks: values.videoLinks
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      documentLinks: values.documentLinks
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      witnessStatements: values.witnessStatements
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      createdBySession: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
      reason: values.reason.trim(),
    };

    const validation = actionCreateSchema.safeParse(payload);
    if (!validation.success) {
      return;
    }

    await createAction(validation.data);
    form.reset();
    setDialogOpen(false);
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto">
              <PlusIcon className="size-4" />
              {t("form.title")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={direction}>
            <DialogHeader>
              <DialogTitle>{t("form.title")}</DialogTitle>
              <DialogDescription>{t("form.subtitle")}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="actionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.actionType")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("form.actionTypePlaceholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="killing">{t("types.killing")}</SelectItem>
                            <SelectItem value="torture">{t("types.torture")}</SelectItem>
                            <SelectItem value="arrest">{t("types.arrest")}</SelectItem>
                            <SelectItem value="assault">{t("types.assault")}</SelectItem>
                            <SelectItem value="other">{t("types.other")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.date")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.location")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.description")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perpetratorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.perpetratorId")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="victimIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.victimIds")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="evidenceUrls"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.evidenceUrls")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2 md:col-span-2">
                    <Input
                      id="action-evidence-upload"
                      type="file"
                      multiple
                      onChange={handleEvidenceUpload}
                      disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isUploading ? t("form.uploading") : t("form.uploadEvidence")}
                    </p>
                    {uploadError ? (
                      <p className="text-xs text-destructive">{uploadError}</p>
                    ) : null}
                  </div>
                  <FormField
                    control={form.control}
                    name="videoLinks"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.videoLinks")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="documentLinks"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.documentLinks")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="witnessStatements"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.witnessStatements")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Separator />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.reason")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t("form.submitting") : t("form.submit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {actions === undefined ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : (
        <DataTable
          data={actionRows}
          columns={[
            {
              key: "actionType",
              label: t("form.actionType"),
              sortable: true,
              render: (action) => (
                <Badge variant="secondary">
                  {t(`types.${action.actionType}`)}
                </Badge>
              ),
            },
            {
              key: "date",
              label: t("form.date"),
              sortable: true,
            },
            {
              key: "location",
              label: t("form.location"),
              sortable: true,
            },
            {
              key: "description",
              label: t("form.description"),
              render: (action) => (
                <div className="max-w-md truncate">
                  {action.description}
                </div>
              ),
            },
          ]}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(action) => router.push(`/${locale}/actions/${action._id}`)}
          direction={direction}
          showStatusFilter
          statusOptions={[
            { value: "killing", label: t("types.killing") },
            { value: "torture", label: t("types.torture") },
            { value: "arrest", label: t("types.arrest") },
            { value: "assault", label: t("types.assault") },
            { value: "other", label: t("types.other") },
          ]}
          filters={[{ key: "location", label: t("form.location") }]}
          labels={{
            all: table("all"),
            results: (from, to, filtered, total) =>
              filtered === total
                ? table("results", { from, to, total })
                : table("resultsFiltered", { from, to, filtered, total }),
            page: (current, total) => table("page", { current, total }),
            rowsPerPage: table("rowsPerPage"),
            noResults: table("noResults"),
            previous: table("previous"),
            next: table("next"),
            status: table("status"),
          }}
        />
      )}
    </section>
  );
}

type ActionRow = {
  _id: string;
  actionType: string;
  date: string;
  location: string;
  description: string;
};
