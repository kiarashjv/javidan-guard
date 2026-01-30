"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { api } from "@/lib/convex-api";
import { actionCreateSchema, actionFormSchema } from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";

export default function ActionCreatePage() {
  const locale = useLocale();
  const t = useTranslations("actions");
  const detailT = useTranslations("actionDetail");
  const createAction = useMutation(api.actions.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const direction = locale === "fa" ? "rtl" : "ltr";

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
    } catch {
      // ignore; upload errors can be handled later
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
  }

  return (
    <section className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("form.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("form.subtitle")}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/actions`}>{detailT("back")}</Link>
        </Button>
      </div>

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
                type="file"
                multiple
                onChange={handleEvidenceUpload}
              />
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
            <Button asChild type="button" variant="outline">
              <Link href={`/${locale}/actions`}>{detailT("back")}</Link>
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
