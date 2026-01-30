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
import {
  regimeMemberCreateSchema,
  regimeMemberFormSchema,
} from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";
import type { RegimeMemberStatus } from "@/types/records";

export default function RegimeMembersPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("regimeMembers");
  const table = useTranslations("table");
  const members = useQuery(api.regimeMembers.listCurrent, {});
  const createMember = useMutation(api.regimeMembers.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const direction = locale === "fa" ? "rtl" : "ltr";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof regimeMemberFormSchema>>({
    resolver: zodResolver(regimeMemberFormSchema),
    defaultValues: {
      name: "",
      organization: "",
      unit: "",
      position: "",
      rank: "",
      status: "active",
      lastKnownLocation: "",
      aliases: "",
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

  async function handleSubmit(values: z.infer<typeof regimeMemberFormSchema>) {
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();

    const payload = {
      name: values.name.trim(),
      aliases: values.aliases
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      photoUrls: values.photoUrls
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      organization: values.organization.trim(),
      unit: values.unit.trim(),
      position: values.position.trim(),
      rank: values.rank.trim(),
      status: values.status as RegimeMemberStatus,
      lastKnownLocation: values.lastKnownLocation.trim(),
      createdBySession: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
      reason: values.reason.trim(),
    };

    const validation = regimeMemberCreateSchema.safeParse(payload);
    if (!validation.success) {
      return;
    }

    await createMember(validation.data);
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
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.organization")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.unit")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.position")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.rank")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                            <SelectItem value="active">{t("status.active")}</SelectItem>
                            <SelectItem value="arrested">{t("status.arrested")}</SelectItem>
                            <SelectItem value="fled">{t("status.fled")}</SelectItem>
                            <SelectItem value="deceased">{t("status.deceased")}</SelectItem>
                            <SelectItem value="unknown">{t("status.unknown")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastKnownLocation"
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
                    name="aliases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.aliases")}</FormLabel>
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
                      id="member-photo-upload"
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

      {members === undefined ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : (
        <DataTable
          data={members}
          columns={[
            {
              key: "name",
              label: t("form.name"),
              sortable: true,
            },
            {
              key: "organization",
              label: t("form.organization"),
              sortable: true,
            },
            {
              key: "position",
              label: t("form.position"),
              sortable: true,
            },
            {
              key: "status",
              label: t("form.status"),
              sortable: true,
              render: (member) => (
                <Badge variant="secondary">
                  {t(`status.${member.status}`)}
                </Badge>
              ),
            },
            {
              key: "lastKnownLocation",
              label: t("form.location"),
            },
          ]}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(member) => router.push(`/${locale}/regime-members/${member._id}`)}
          direction={direction}
          showStatusFilter
          statusOptions={[
            { value: "active", label: t("status.active") },
            { value: "arrested", label: t("status.arrested") },
            { value: "fled", label: t("status.fled") },
            { value: "deceased", label: t("status.deceased") },
            { value: "unknown", label: t("status.unknown") },
          ]}
          filters={[
            { key: "organization", label: t("form.organization") },
            { key: "unit", label: t("form.unit") },
            { key: "lastKnownLocation", label: t("form.location") },
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
