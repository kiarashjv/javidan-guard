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
import { victimCreateSchema, victimFormSchema } from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";
import type { VictimStatus } from "@/types/records";

export default function VictimCreatePage() {
  const locale = useLocale();
  const t = useTranslations("victims");
  const detailT = useTranslations("victimDetail");
  const createVictim = useMutation(api.victims.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const direction = locale === "fa" ? "rtl" : "ltr";

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
    } catch {
      // ignore; upload errors can be handled later
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
  }

  return (
    <section className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("form.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("form.subtitle")}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/victims`}>{detailT("back")}</Link>
        </Button>
      </div>

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
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
              />
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
            <Button asChild type="button" variant="outline">
              <Link href={`/${locale}/victims`}>{detailT("back")}</Link>
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
