"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { victimCreateSchema, victimFormSchema } from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";
import type { VictimStatus } from "@/types/records";

export default function VictimsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("victims");
  const table = useTranslations("table");
  const victims = useQuery(api.victims.listCurrent, {});
  const createVictim = useMutation(api.victims.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const direction = locale === "fa" ? "rtl" : "ltr";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  type VictimFormValues = z.input<typeof victimFormSchema>;
  const form = useForm<VictimFormValues>({
    resolver: zodResolver(victimFormSchema),
    defaultValues: {
      name: "",
      age: 0,
      hometown: "",
      status: "murdered",
      incidentDate: "",
      incidentLocation: "",
      circumstances: "",
      evidenceLinks: "",
      newsReports: "",
      witnessAccounts: "",
      linkedPerpetrators: "",
      photoUrls: "",
      reason: "",
    },
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
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
        const existing = form.getValues("photoUrls").trim();
        const combined = existing.length
          ? `${existing}, ${uploadedUrls.join(", ")}`
          : uploadedUrls.join(", ");
        form.setValue("photoUrls", combined, { shouldDirty: true });
      }
      event.target.value = "";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(values: VictimFormValues) {
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();
    const parsed = victimFormSchema.parse(values);

    const payload = {
      name: parsed.name.trim(),
      age: parsed.age,
      photoUrls: parsed.photoUrls
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      hometown: parsed.hometown.trim(),
      status: parsed.status as VictimStatus,
      incidentDate: parsed.incidentDate.trim(),
      incidentLocation: parsed.incidentLocation.trim(),
      circumstances: parsed.circumstances.trim(),
      evidenceLinks: parsed.evidenceLinks
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      newsReports: parsed.newsReports
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      witnessAccounts: parsed.witnessAccounts
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      linkedPerpetrators: parsed.linkedPerpetrators
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      createdBySession: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
      reason: parsed.reason.trim(),
    };

    const validation = victimCreateSchema.safeParse(payload);
    if (!validation.success) {
      return;
    }

    await createVictim(validation.data);
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.age")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            value={
                              typeof field.value === "number" || typeof field.value === "string"
                                ? field.value
                                : ""
                            }
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.status")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("form.statusPlaceholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="murdered">{t("status.murdered")}</SelectItem>
                            <SelectItem value="captured">{t("status.captured")}</SelectItem>
                            <SelectItem value="vanished">{t("status.vanished")}</SelectItem>
                            <SelectItem value="released">{t("status.released")}</SelectItem>
                            <SelectItem value="confirmed_dead">
                              {t("status.confirmed_dead")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.incidentDate")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="circumstances"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.circumstances")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="evidenceLinks"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.evidenceLinks")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newsReports"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.newsReports")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="witnessAccounts"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.witnessAccounts")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedPerpetrators"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.linkedPerpetrators")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hometown"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.hometown")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="incidentLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.incidentLocation")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="photoUrls"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("form.photos")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2 md:col-span-2">
                    <Input
                      id="victim-photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isUploading ? t("form.uploading") : t("form.uploadPhotos")}
                    </p>
                    {uploadError ? (
                      <p className="text-xs text-destructive">{uploadError}</p>
                    ) : null}
                  </div>
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

      {victims === undefined ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : (
        <DataTable
          data={victims}
          columns={[
            {
              key: "name",
              label: t("form.name"),
              sortable: true,
            },
            {
              key: "age",
              label: t("form.age"),
              sortable: true,
              render: (victim) => victim.age || "-",
            },
            {
              key: "hometown",
              label: t("form.hometown"),
              sortable: true,
            },
            {
              key: "status",
              label: t("form.status"),
              sortable: true,
              render: (victim) => (
                <Badge variant="secondary">
                  {t(`status.${victim.status}`)}
                </Badge>
              ),
            },
            {
              key: "incidentDate",
              label: t("form.incidentDate"),
              sortable: true,
            },
            {
              key: "incidentLocation",
              label: t("form.incidentLocation"),
            },
          ]}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(victim) => router.push(`/${locale}/victims/${victim._id}`)}
          direction={direction}
          showStatusFilter
          statusOptions={[
            { value: "murdered", label: t("status.murdered") },
            { value: "captured", label: t("status.captured") },
            { value: "vanished", label: t("status.vanished") },
            { value: "released", label: t("status.released") },
            { value: "confirmed_dead", label: t("status.confirmed_dead") },
          ]}
          filters={[
            { key: "hometown", label: t("form.hometown") },
            { key: "incidentLocation", label: t("form.incidentLocation") },
          ]}
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
