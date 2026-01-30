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
import {
  regimeMemberCreateSchema,
  regimeMemberFormSchema,
} from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";
import type { RegimeMemberStatus } from "@/types/records";

export default function RegimeMemberCreatePage() {
  const locale = useLocale();
  const t = useTranslations("regimeMembers");
  const detailT = useTranslations("regimeMember");
  const createMember = useMutation(api.regimeMembers.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const direction = locale === "fa" ? "rtl" : "ltr";

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
  }

  return (
    <section className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("form.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("form.subtitle")}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/regime-members`}>{detailT("back")}</Link>
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
              <Link href={`/${locale}/regime-members`}>{detailT("back")}</Link>
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
