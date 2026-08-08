import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

const sujets = [
  "Adhésion",
  "Événement",
  "Boutique / commande",
  "Partenariat",
  "Rejoindre le bureau",
  "Autre",
] as const;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indique ton nom (2 caractères minimum).")
    .max(80, "80 caractères maximum."),
  email: z
    .string()
    .trim()
    .min(1, "Indique une adresse e-mail.")
    .email("Format d'adresse e-mail invalide.")
    .max(255, "255 caractères maximum."),
  sujet: z.enum(sujets, { message: "Choisis un sujet." }),
  message: z
    .string()
    .trim()
    .min(20, "Détaille un peu ta demande (20 caractères minimum).")
    .max(1500, "1500 caractères maximum."),
  consent: z.literal(true, { message: "Coche la case pour autoriser la réponse par e-mail." }),
});

type ContactFormValues = z.infer<typeof schema>;

const inputClass =
  "min-h-[44px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-base text-ae2v-black outline-none transition-colors placeholder:text-ae2v-black/40 focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40 aria-[invalid=true]:border-ae2v-red";

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase"
      >
        {label}
        {required ? <span className="text-ae2v-red"> *</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ae2v-black/60">
          {hint}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex gap-2 text-sm font-bold text-ae2v-red">
          <span aria-hidden="true">✕</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Formulaire de contact AE2V (démonstration côté navigateur).
 * Labels visibles, erreurs reliées aux champs, valeurs conservées après erreur,
 * et repli explicite vers l'e-mail officiel tant que l'envoi serveur n'existe pas.
 */
export function ContactForm() {
  const [sent, setSent] = useState<ContactFormValues | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", message: "" } as Partial<ContactFormValues> as ContactFormValues,
  });

  const describe = (name: keyof ContactFormValues, hint?: boolean) =>
    [errors[name] ? `${name}-error` : null, hint ? `${name}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  function onSubmit(values: ContactFormValues) {
    setSent(values);
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  if (sent) {
    const mailto = `mailto:ae2v.asso@gmail.com?subject=${encodeURIComponent(
      `[${sent.sujet}] ${sent.name}`,
    )}&body=${encodeURIComponent(`${sent.message}\n\n— ${sent.name} (${sent.email})`)}`;

    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="border-2 border-ae2v-black bg-card p-6 outline-none md:p-8"
      >
        <p className="inline-flex items-center gap-2 bg-ae2v-green px-3 py-1 text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
          <Check aria-hidden="true" className="size-4" />
          Message prêt
        </p>
        <h3 className="ae2v-headline mt-4 text-[clamp(1.6rem,4vw,2.4rem)]">Merci {sent.name} !</h3>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          L'envoi automatique arrivera avec la phase serveur. Pour que ta demande parte dès
          maintenant, ouvre ton logiciel de messagerie : le message est déjà prérempli. Le bureau
          répond en général sous 3 jours ouvrés à <strong>{sent.email}</strong>.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg">
            <a href={mailto}>
              <Mail aria-hidden="true" />
              Envoyer par e-mail
            </a>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            onClick={() => {
              reset();
              setSent(null);
            }}
          >
            Écrire un autre message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="border-2 border-ae2v-black bg-card p-5 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell id="name" label="Nom et prénom" required error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describe("name")}
            {...register("name")}
          />
        </FieldShell>

        <FieldShell id="email" label="E-mail" required error={errors.email?.message}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describe("email")}
            {...register("email")}
          />
        </FieldShell>

        <FieldShell
          id="sujet"
          label="Sujet"
          required
          error={errors.sujet?.message}
          className="sm:col-span-2"
        >
          <select
            id="sujet"
            defaultValue=""
            className={inputClass}
            aria-invalid={Boolean(errors.sujet)}
            aria-describedby={describe("sujet")}
            {...register("sujet")}
          >
            <option value="" disabled>
              Choisis un sujet…
            </option>
            {sujets.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FieldShell>

        <FieldShell
          id="message"
          label="Message"
          required
          hint="20 caractères minimum. Précise ta filière si ta demande concerne l'adhésion."
          error={errors.message?.message}
          className="sm:col-span-2"
        >
          <textarea
            id="message"
            rows={6}
            maxLength={1500}
            className={`${inputClass} min-h-[9rem] resize-y`}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describe("message", true)}
            {...register("message")}
          />
        </FieldShell>

        <FieldShell
          id="consent"
          label="Réponse par e-mail"
          required
          error={errors.consent?.message}
          className="sm:col-span-2"
        >
          <label
            htmlFor="consent"
            className="tap-44 flex cursor-pointer items-start gap-3 border-2 border-ae2v-black/25 bg-ae2v-offwhite p-3 text-sm text-ae2v-black"
          >
            <input
              id="consent"
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 accent-ae2v-red"
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={describe("consent")}
              {...register("consent")}
            />
            <span>
              J'autorise l'AE2V à utiliser mon adresse e-mail pour répondre à ce message
              uniquement. Aucune inscription à une liste de diffusion.
            </span>
          </label>
        </FieldShell>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
          Envoyer le message
        </Button>
        <p className="text-xs text-muted-foreground">
          Ou directement :{" "}
          <a href="mailto:ae2v.asso@gmail.com" className="font-bold underline">
            ae2v.asso@gmail.com
          </a>
        </p>
      </div>
    </form>
  );
}
