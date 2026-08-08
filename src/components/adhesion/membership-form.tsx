import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import { TapeLabel } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useDemoSession } from "@/lib/demo-session";

/* -------------------------------------------------------------------------- */
/*  Année scolaire courante (rentrée en septembre)                             */
/* -------------------------------------------------------------------------- */

function currentSchoolYear(now = new Date()) {
  const y = now.getFullYear();
  const start = now.getMonth() >= 7 ? y : y - 1; // août = bascule
  return `${start}-${start + 1}`;
}

/* -------------------------------------------------------------------------- */
/*  Schéma de validation                                                       */
/* -------------------------------------------------------------------------- */

const departements = [
  "GEII",
  "GMP",
  "MMI",
  "Informatique",
  "RT",
  "TC",
  "Autre / Licence pro",
] as const;

const niveaux = ["1re année", "2e année", "3e année", "Autre"] as const;

const schema = z.object({
  // 1. Identité
  firstName: z
    .string()
    .trim()
    .min(2, "Indique ton prénom (2 caractères minimum).")
    .max(60, "60 caractères maximum."),
  lastName: z
    .string()
    .trim()
    .min(2, "Indique ton nom (2 caractères minimum).")
    .max(60, "60 caractères maximum."),
  birthDate: z
    .string()
    .min(1, "Indique ta date de naissance.")
    .refine((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return false;
      const age = (Date.now() - d.getTime()) / 31557600000;
      return age >= 15 && age <= 100;
    }, "Date de naissance invalide (adhésion à partir de 15 ans)."),
  email: z
    .string()
    .trim()
    .min(1, "Indique une adresse e-mail.")
    .email("Format d'adresse e-mail invalide.")
    .max(255, "255 caractères maximum."),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/, "Numéro français invalide (ex. 06 12 34 56 78)."),

  // 2. Scolarité
  studentId: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z]{6,12}$/, "Numéro étudiant invalide (6 à 12 caractères)."),
  departement: z.enum(departements, { message: "Choisis ton département." }),
  niveau: z.enum(niveaux, { message: "Choisis ton année d'étude." }),
  groupe: z.string().trim().max(12, "12 caractères maximum.").optional().or(z.literal("")),

  // 3. Adhésion — cotisation FACULTATIVE, montant libre à partir de 5 €
  cotisation: z.enum(["aucune", "libre"], {
    message: "Indique si tu souhaites cotiser.",
  }),
  customAmount: z.string().trim().optional().or(z.literal("")),
  interests: z.array(z.string()).max(8),
  volunteer: z.enum(["oui", "peut-etre", "non"], { message: "Réponds à cette question." }),
  message: z.string().trim().max(500, "500 caractères maximum.").optional().or(z.literal("")),

  // 4. Préférences e-mail
  emailOptIn: z.boolean(),
  emailTopics: z.array(z.string()).max(8),

  // 5. Consentements
  rgpd: z.literal(true, { message: "Ton accord est nécessaire pour traiter ta demande." }),
  statuts: z.literal(true, { message: "Tu dois accepter les statuts et le règlement." }),
  imageRight: z.boolean(),
});

export type MembershipFormValues = z.infer<typeof schema>;

const interestOptions = [
  "Soirées & événements",
  "Sport",
  "Culture & sorties",
  "Jeux / e-sport",
  "Communication & photo",
  "Partenariats",
  "Solidarité",
  "Boutique & goodies",
];

const stepFields: Array<Array<keyof MembershipFormValues>> = [
  ["firstName", "lastName", "birthDate", "email", "phone"],
  ["studentId", "departement", "niveau", "groupe"],
  ["cotisation", "customAmount", "interests", "volunteer", "message"],
  ["emailOptIn", "emailTopics"],
  ["rgpd", "statuts", "imageRight"],
];

const stepTitles = ["Identité", "Scolarité", "Adhésion", "E-mails", "Confirmation"];

/** Sujets de diffusion : fusionnés avec le système d'e-mails de l'association. */
const emailTopicOptions = [
  "Événements & soirées",
  "Billetterie & rappels",
  "Boutique & précommandes",
  "Partenariats & bons plans",
  "Vie du bureau & votes",
  "Recrutement de bénévoles",
];

/** Montant de la cotisation en centimes à partir des valeurs du formulaire. */
function contributionCents(values: {
  cotisation?: string | undefined;
  customAmount?: string | undefined;
}): number {
  if (values.cotisation !== "libre") return 0;
  const n = Number(String(values.customAmount ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/* -------------------------------------------------------------------------- */
/*  Primitives de champ (labels visibles, erreurs reliées, 44px de cible)      */
/* -------------------------------------------------------------------------- */

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
        {required ? (
          <span className="text-ae2v-red"> *</span>
        ) : (
          <span className="ml-1 font-medium tracking-normal text-ae2v-black/50 normal-case">
            (facultatif)
          </span>
        )}
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

/* -------------------------------------------------------------------------- */
/*  Formulaire                                                                 */
/* -------------------------------------------------------------------------- */

export function MembershipForm() {
  const session = useDemoSession();
  const addDossier = (session as unknown as { addDossier?: (d: any) => void }).addDossier;
  const year = useMemo(() => currentSchoolYear(), []);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<MembershipFormValues | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    clearErrors,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MembershipFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      email: "",
      phone: "",
      studentId: "",
      groupe: "",
      interests: [],
      message: "",
      cotisation: "aucune",
      customAmount: "",
      emailOptIn: true,
      emailTopics: ["Événements & soirées"],
      imageRight: false,
    },
  });

  const values = watch();

  const errId = (name: keyof MembershipFormValues, hint?: boolean) =>
    [errors[name] ? `${name}-error` : null, hint ? `${name}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  async function goNext() {
    // Les erreurs posées manuellement (règles inter-champs) sont rejouées ci-dessous.
    clearErrors(["customAmount", "emailTopics"]);
    const ok = await trigger(stepFields[step]!, { shouldFocus: true });
    if (!ok) return;

    // Règles inter-champs vérifiées à l'étape concernée (montant libre, e-mails).
    const current = getValues();
    if (step === 2 && current.cotisation === "libre") {
      const amount = Number(String(current.customAmount ?? "").replace(",", "."));
      if (!Number.isFinite(amount) || amount < 5 || amount > 500) {
        setError("customAmount", {
          type: "manual",
          message: "Montant libre : entre 5 € et 500 €.",
        });
        return;
      }
    }
    if (step === 3 && current.emailOptIn && current.emailTopics.length === 0) {
      setError("emailTopics", {
        type: "manual",
        message: "Choisis au moins un sujet, ou décoche la réception d'e-mails.",
      });
      return;
    }
    setStep((s) => Math.min(s + 1, stepFields.length - 1));
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function onSubmit(data: MembershipFormValues) {
    // Garde finale sur les règles inter-champs (montant libre, sujets d'e-mails).
    if (data.cotisation === "libre") {
      const amount = Number(String(data.customAmount ?? "").replace(",", "."));
      if (!Number.isFinite(amount) || amount < 5 || amount > 500) {
        setError("customAmount", { type: "manual", message: "Montant libre : entre 5 € et 500 €." });
        setStep(2);
        return;
      }
    }
    if (data.emailOptIn && data.emailTopics.length === 0) {
      setError("emailTopics", {
        type: "manual",
        message: "Choisis au moins un sujet, ou décoche la réception d'e-mails.",
      });
      setStep(3);
      return;
    }
    if (addDossier) {
      addDossier({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
        studentId: data.studentId,
        departement: data.departement,
        niveau: data.niveau,
        contributionCents: contributionCents(data),
        contributionStatus: contributionCents(data) > 0 ? "PAIEMENT_EN_ATTENTE" : "NON_COTISANT",
        emailPrefs: data.emailOptIn ? data.emailTopics : [],
      });
    }
    setSubmitted(data);
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  /* ----------------------------- Écran de fin ----------------------------- */

  if (submitted) {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        className="border-2 border-ae2v-black bg-ae2v-offwhite p-6 outline-none md:p-8"
      >
        <TapeLabel tone="green">Demande enregistrée</TapeLabel>
        <h3 className="ae2v-headline mt-5 text-[clamp(1.8rem,5vw,3rem)] text-ae2v-black">
          Merci {submitted.firstName} !
        </h3>
        <p className="mt-3 max-w-xl text-sm text-ae2v-black/75">
          Ta demande d'adhésion {year} a bien été enregistrée. Elle sera vérifiée par le BDE et un
          e-mail de validation sera envoyé dès que possible à{" "}
          <strong className="font-bold">{submitted.email}</strong>.
        </p>
        {contributionCents(submitted) > 0 ? (
          <p className="mt-3 max-w-xl border-2 border-ae2v-black bg-ae2v-acid p-3 text-sm font-bold text-ae2v-black">
            Cotisation de {(contributionCents(submitted) / 100).toFixed(2)} € : elle sera réglée au
            bureau du BDE après validation de ton adhésion. L'e-mail de validation expliquera la
            procédure.
          </p>
        ) : null}
        <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Recap label="Nom complet" value={`${submitted.firstName} ${submitted.lastName}`} />
          <Recap label="Formation" value={`${submitted.departement} · ${submitted.niveau}`} />
          <Recap label="Numéro étudiant" value={submitted.studentId} />
          <Recap
            label="Cotisation"
            value={
              contributionCents(submitted) === 0
                ? "Aucune (adhésion sans cotisation)"
                : `${(contributionCents(submitted) / 100).toFixed(2)} €`
            }
          />
          <Recap
            label="E-mails"
            value={
              submitted.emailOptIn
                ? submitted.emailTopics.join(", ") || "Aucun sujet sélectionné"
                : "Aucun e-mail"
            }
          />
        </dl>
        <Button className="mt-8" onClick={() => setSubmitted(null)} variant="black">
          Modifier ma demande
        </Button>
      </div>
    );
  }

  /* ------------------------------ Formulaire ------------------------------ */

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 md:p-8"
      aria-labelledby="adhesion-step-title"
    >
      {/* Statut visible : étape en cours */}
      <ol className="flex flex-wrap gap-2" aria-label="Étapes du formulaire">
        {stepTitles.map((title, index) => {
          const state = index === step ? "current" : index < step ? "done" : "todo";
          return (
            <li key={title}>
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={[
                  "flex min-h-[36px] items-center gap-2 border-2 px-3 text-xs font-bold tracking-[0.12em] uppercase",
                  state === "current"
                    ? "border-ae2v-red bg-ae2v-red text-ae2v-offwhite"
                    : state === "done"
                      ? "border-ae2v-black bg-ae2v-black text-ae2v-offwhite"
                      : "border-ae2v-black/25 bg-transparent text-ae2v-black/60",
                ].join(" ")}
              >
                {state === "done" ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                <span className="sr-only">
                  Étape {index + 1} sur {stepTitles.length}
                  {state === "done" ? ", terminée" : state === "current" ? ", en cours" : ""} :
                </span>
                {title}
              </span>
            </li>
          );
        })}
      </ol>

      <h3
        id="adhesion-step-title"
        ref={headingRef}
        tabIndex={-1}
        className="ae2v-headline mt-6 text-2xl text-ae2v-black outline-none md:text-3xl"
      >
        {step + 1}. {stepTitles[step]}
      </h3>
      <p className="mt-2 text-sm text-ae2v-black/70">
        Champs marqués <span className="font-bold text-ae2v-red">*</span> obligatoires. Tes réponses
        sont conservées si une erreur survient.
      </p>

      <div className="mt-6 grid gap-5">
        {/* --------------------------- Étape 1 --------------------------- */}
        {step === 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell id="firstName" label="Prénom" required error={errors.firstName?.message}>
                <input
                  id="firstName"
                  className={inputClass}
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errId("firstName")}
                  {...register("firstName")}
                />
              </FieldShell>
              <FieldShell id="lastName" label="Nom" required error={errors.lastName?.message}>
                <input
                  id="lastName"
                  className={inputClass}
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errId("lastName")}
                  {...register("lastName")}
                />
              </FieldShell>
            </div>
            <FieldShell
              id="birthDate"
              label="Date de naissance"
              required
              hint="Utilisée pour vérifier l'accès à certains événements."
              error={errors.birthDate?.message}
            >
              <input
                id="birthDate"
                type="date"
                className={inputClass}
                autoComplete="bday"
                aria-invalid={!!errors.birthDate}
                aria-describedby={errId("birthDate", true)}
                {...register("birthDate")}
              />
            </FieldShell>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell
                id="email"
                label="Adresse e-mail"
                required
                hint="De préférence ton adresse universitaire."
                error={errors.email?.message}
              >
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  className={inputClass}
                  autoComplete="email"
                  placeholder="prenom.nom@etu.uvsq.fr"
                  aria-invalid={!!errors.email}
                  aria-describedby={errId("email", true)}
                  {...register("email")}
                />
              </FieldShell>
              <FieldShell
                id="phone"
                label="Téléphone"
                required
                hint="Pour te prévenir en cas de changement de dernière minute."
                error={errors.phone?.message}
              >
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  className={inputClass}
                  autoComplete="tel"
                  placeholder="06 12 34 56 78"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errId("phone", true)}
                  {...register("phone")}
                />
              </FieldShell>
            </div>
          </>
        ) : null}

        {/* --------------------------- Étape 2 --------------------------- */}
        {step === 1 ? (
          <>
            <FieldShell
              id="studentId"
              label="Numéro étudiant"
              required
              hint="Il figure sur ta carte étudiante."
              error={errors.studentId?.message}
            >
              <input
                id="studentId"
                className={inputClass}
                inputMode="numeric"
                aria-invalid={!!errors.studentId}
                aria-describedby={errId("studentId", true)}
                {...register("studentId")}
              />
            </FieldShell>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell
                id="departement"
                label="Département / formation"
                required
                error={errors.departement?.message}
              >
                <select
                  id="departement"
                  className={inputClass}
                  defaultValue=""
                  aria-invalid={!!errors.departement}
                  aria-describedby={errId("departement")}
                  {...register("departement")}
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {departements.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell
                id="niveau"
                label="Année d'étude"
                required
                error={errors.niveau?.message}
              >
                <select
                  id="niveau"
                  className={inputClass}
                  defaultValue=""
                  aria-invalid={!!errors.niveau}
                  aria-describedby={errId("niveau")}
                  {...register("niveau")}
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {niveaux.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </FieldShell>
            </div>
            <FieldShell
              id="groupe"
              label="Groupe / TD"
              hint="Exemple : A2, TD3."
              error={errors.groupe?.message}
            >
              <input
                id="groupe"
                className={`${inputClass} sm:max-w-[12rem]`}
                aria-invalid={!!errors.groupe}
                aria-describedby={errId("groupe", true)}
                {...register("groupe")}
              />
            </FieldShell>
          </>
        ) : null}

        {/* --------------------------- Étape 3 --------------------------- */}
        {step === 2 ? (
          <>
            <fieldset>
              <legend className="text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                Cotisation{" "}
                <span className="font-medium tracking-normal text-ae2v-black/50 normal-case">
                  (facultative)
                </span>
              </legend>
              <p className="mt-1 text-sm text-ae2v-black/70">
                Année scolaire {year}. L'adhésion est gratuite. Si tu souhaites soutenir
                l'association, le montant est libre, à partir de 5 €.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "aucune",
                    title: "Sans cotisation",
                    text: "Adhésion simple, aucun montant versé.",
                  },
                  {
                    value: "libre",
                    title: "Je souhaite cotiser",
                    text: "Montant libre à partir de 5 €.",
                  },
                ].map((option) => {
                  const active = values.cotisation === option.value;
                  return (
                    <label
                      key={option.value}
                      className={[
                        "flex min-h-[44px] cursor-pointer gap-3 border-2 p-4 transition-colors",
                        active
                          ? "border-ae2v-red bg-ae2v-red/10"
                          : "border-ae2v-black/25 hover:border-ae2v-black",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        className="mt-1 h-5 w-5 accent-[var(--ae2v-red)]"
                        aria-describedby={errId("cotisation")}
                        {...register("cotisation")}
                      />
                      <span>
                        <span className="block text-sm font-bold text-ae2v-black">
                          {option.title}
                        </span>
                        <span className="mt-1 block text-xs text-ae2v-black/70">{option.text}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.cotisation ? (
                <p id="cotisation-error" className="mt-2 text-sm font-bold text-ae2v-red">
                  <span aria-hidden="true">✕ </span>
                  {errors.cotisation.message}
                </p>
              ) : null}

              {values.cotisation === "libre" ? (
                <>
                  <FieldShell
                    id="customAmount"
                    className="mt-4"
                    label="Montant libre (en euros)"
                    required
                    hint="Minimum 5 €, maximum 500 €."
                    error={errors.customAmount?.message}
                  >
                    <input
                      id="customAmount"
                      type="number"
                      min={5}
                      max={500}
                      step="1"
                      inputMode="decimal"
                      autoComplete="off"
                      className={`${inputClass} sm:max-w-[12rem]`}
                      aria-invalid={!!errors.customAmount}
                      aria-describedby={errId("customAmount", true)}
                      {...register("customAmount")}
                    />
                  </FieldShell>

                  <p className="mt-4 border-2 border-ae2v-black bg-ae2v-offwhite p-3 text-sm text-ae2v-black">
                    La cotisation sera réglée <strong>au bureau du BDE</strong> après validation de
                    ton adhésion. L'e-mail de validation expliquera la procédure.
                  </p>
                </>
              ) : null}

              <p className="mt-4 border-2 border-ae2v-black bg-ae2v-acid p-3 text-sm font-bold text-ae2v-black">
                Montant retenu :{" "}
                {contributionCents(values) === 0
                  ? "aucune cotisation"
                  : `${(contributionCents(values) / 100).toFixed(2)} €`}
              </p>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                Ce qui t'intéresse{" "}
                <span className="font-medium tracking-normal text-ae2v-black/50 normal-case">
                  (facultatif)
                </span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <label
                    key={interest}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 border-2 border-ae2v-black/25 px-3 text-sm text-ae2v-black transition-colors has-[:checked]:border-ae2v-black has-[:checked]:bg-ae2v-acid"
                  >
                    <input
                      type="checkbox"
                      value={interest}
                      className="h-4 w-4 accent-[var(--ae2v-black)]"
                      {...register("interests")}
                    />
                    {interest}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                Souhaites-tu aider sur les événements ? <span className="text-ae2v-red">*</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: "oui", label: "Oui" },
                  { value: "peut-etre", label: "Peut-être" },
                  { value: "non", label: "Non" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 border-2 border-ae2v-black/25 px-4 text-sm font-bold text-ae2v-black transition-colors has-[:checked]:border-ae2v-red has-[:checked]:bg-ae2v-red has-[:checked]:text-ae2v-offwhite"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      className="h-4 w-4 accent-[var(--ae2v-red)]"
                      aria-describedby={errId("volunteer")}
                      {...register("volunteer")}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.volunteer ? (
                <p id="volunteer-error" className="mt-2 text-sm font-bold text-ae2v-red">
                  <span aria-hidden="true">✕ </span>
                  {errors.volunteer.message}
                </p>
              ) : null}
            </fieldset>

            <FieldShell
              id="message"
              label="Message au bureau"
              hint="Question, besoin d'accessibilité, allergie alimentaire…"
              error={errors.message?.message}
            >
              <textarea
                id="message"
                rows={4}
                className={inputClass}
                maxLength={500}
                aria-invalid={!!errors.message}
                aria-describedby={errId("message", true)}
                {...register("message")}
              />
            </FieldShell>
          </>
        ) : null}

        {/* --------------------------- Étape 4 : e-mails ------------------ */}
        {step === 3 ? (
          <>
            <ConsentBox
              id="emailOptIn"
              label="J'accepte de recevoir des e-mails de l'AE2V (annonces, billetterie, bons plans). Je peux me désinscrire à tout moment via le lien en bas de chaque e-mail."
              {...register("emailOptIn")}
            />

            <fieldset disabled={!values.emailOptIn}>
              <legend className="text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                Ce que tu veux recevoir
              </legend>
              <p className="mt-1 text-xs text-ae2v-black/70">
                Tu ne reçois que les sujets cochés : le système d'e-mails est fusionné avec tes
                centres d'intérêt.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {emailTopicOptions.map((topic) => (
                  <label
                    key={topic}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 border-2 border-ae2v-black/25 px-3 text-sm text-ae2v-black transition-colors has-[:checked]:border-ae2v-black has-[:checked]:bg-ae2v-acid"
                  >
                    <input
                      type="checkbox"
                      value={topic}
                      className="h-4 w-4 accent-[var(--ae2v-black)]"
                      {...register("emailTopics")}
                    />
                    {topic}
                  </label>
                ))}
              </div>
              {errors.emailTopics ? (
                <p id="emailTopics-error" className="mt-2 text-sm font-bold text-ae2v-red">
                  <span aria-hidden="true">✕ </span>
                  {errors.emailTopics.message}
                </p>
              ) : null}
            </fieldset>
          </>
        ) : null}

        {/* --------------------------- Étape 5 --------------------------- */}
        {step === 4 ? (
          <>
            <div className="border-2 border-ae2v-black/20 bg-ae2v-black p-5 text-ae2v-offwhite">
              <p className="text-xs font-bold tracking-[0.16em] uppercase">
                Récapitulatif · Année {year}
              </p>
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Recap
                  dark
                  label="Nom complet"
                  value={`${values.firstName || "—"} ${values.lastName || ""}`}
                />
                <Recap dark label="E-mail" value={values.email || "—"} />
                <Recap dark label="Téléphone" value={values.phone || "—"} />
                <Recap dark label="Numéro étudiant" value={values.studentId || "—"} />
                <Recap
                  dark
                  label="Formation"
                  value={`${values.departement ?? "—"}${values.niveau ? ` · ${values.niveau}` : ""}${
                    values.groupe ? ` · ${values.groupe}` : ""
                  }`}
                />
                <Recap
                  dark
                  label="Cotisation"
                  value={
                    contributionCents(values) === 0
                      ? "Aucune (adhésion sans cotisation)"
                      : `${(contributionCents(values) / 100).toFixed(2)} €`
                  }
                />
                <Recap
                  dark
                  label="E-mails"
                  value={
                    values.emailOptIn
                      ? (values.emailTopics ?? []).join(", ") || "Aucun sujet sélectionné"
                      : "Aucun e-mail"
                  }
                />
              </dl>
            </div>

            {/* Ce qui se passe après l'envoi — information indispensable avant validation. */}
            <div className="border-2 border-ae2v-black bg-ae2v-acid p-5 text-ae2v-black">
              <p className="text-xs font-bold tracking-[0.16em] uppercase">Après l'envoi</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  → Ta demande sera vérifiée par le BDE et un e-mail de validation te sera envoyé
                  dès que possible.
                </li>
                {contributionCents(values) > 0 ? (
                  <li>
                    → Ta cotisation de {(contributionCents(values) / 100).toFixed(2)} € sera réglée
                    au bureau du BDE après validation de ton adhésion. L'e-mail de validation
                    expliquera la procédure.
                  </li>
                ) : (
                  <li>
                    → Tu as choisi d'adhérer sans cotisation : aucun règlement ne te sera demandé.
                  </li>
                )}
                <li>→ Aucun paiement n'est demandé sur ce site.</li>
              </ul>
            </div>

            <ConsentBox
              id="rgpd"
              error={errors.rgpd?.message}
              label="J'accepte que l'AE2V conserve ces informations pour gérer mon adhésion pendant l'année scolaire et les durées légales. Je peux demander leur suppression à tout moment."
              required
              {...register("rgpd")}
            />
            <ConsentBox
              id="statuts"
              error={errors.statuts?.message}
              label="J'ai pris connaissance des statuts et du règlement intérieur de l'association et je m'engage à les respecter."
              required
              {...register("statuts")}
            />
            <ConsentBox
              id="imageRight"
              label="J'autorise l'AE2V à publier des photos ou vidéos sur lesquelles j'apparais lors des événements (réseaux sociaux, site)."
              {...register("imageRight")}
            />
          </>
        ) : null}
      </div>

      {/* Navigation : une action principale visible */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t-2 border-ae2v-black/15 pt-6">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={goBack}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Retour
          </Button>
        ) : null}

        {step < stepFields.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Continuer
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours…" : "Envoyer ma demande d'adhésion"}
          </Button>
        )}

        <p className="text-xs text-ae2v-black/60">
          Étape {step + 1} sur {stepTitles.length}
        </p>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function Recap({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div>
      <dt
        className={`text-[0.65rem] font-bold tracking-[0.16em] uppercase ${
          dark ? "text-ae2v-offwhite/60" : "text-ae2v-black/55"
        }`}
      >
        {label}
      </dt>
      <dd className={`mt-1 font-bold ${dark ? "text-ae2v-offwhite" : "text-ae2v-black"}`}>
        {value}
      </dd>
    </div>
  );
}

const ConsentBox = ({
  id,
  label,
  error,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string | undefined;
  required?: boolean | undefined;
}) => (
  <div>
    <label
      htmlFor={id}
      className="flex min-h-[44px] cursor-pointer items-start gap-3 border-2 border-ae2v-black/20 p-4 text-sm text-ae2v-black transition-colors hover:border-ae2v-black has-[:checked]:border-ae2v-black"
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ae2v-red)]"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <span>
        {label}
        {required ? <span className="font-bold text-ae2v-red"> *</span> : null}
      </span>
    </label>
    {error ? (
      <p id={`${id}-error`} className="mt-2 text-sm font-bold text-ae2v-red">
        <span aria-hidden="true">✕ </span>
        {error}
      </p>
    ) : null}
  </div>
);
