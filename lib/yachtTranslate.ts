import type { SiteLocale } from '@/lib/i18n/config'
import { translateText, translateTextArray, translatePortableTextBlocks } from '@/lib/i18n/runtimeTranslate'
import type { YachtRentalDocument } from '@/lib/yachtTypes'

/**
 * Sanity içeriği hep Türkçe kalır; sayfa `en`/`de` isterse burada anlık
 * (runtime) makine çevirisi uygulanır. Hiçbir çeviri Sanity'e yazılmaz.
 */
export async function translateYachtRentalDocument(
  yacht: YachtRentalDocument,
  locale: SiteLocale
): Promise<YachtRentalDocument> {
  if (locale === 'tr') return yacht

  const [
    shortDescription,
    fullDescription,
    amenities,
    included,
    notIncluded,
    routeSuggestions,
    termsAndNotes,
    cancellationPaymentPolicies,
    cancellationCheckPriceLabel,
    sailingLicenceRequired,
    petsPolicy,
    paymentMethodsAccepted,
    marinaInformation,
    faqs,
  ] = await Promise.all([
    translateText(yacht.shortDescription, locale),
    translatePortableTextBlocks(yacht.fullDescription, locale),
    translateTextArray(yacht.amenities, locale),
    translateTextArray(yacht.included, locale),
    translateTextArray(yacht.notIncluded, locale),
    translateTextArray(yacht.routeSuggestions, locale),
    translateText(yacht.termsAndNotes, locale),
    translatePortableTextBlocks(yacht.cancellationPaymentPolicies, locale),
    translateText(yacht.cancellationCheckPriceLabel, locale),
    translateText(yacht.sailingLicenceRequired, locale),
    translateText(yacht.petsPolicy, locale),
    translateTextArray(yacht.paymentMethodsAccepted, locale),
    translatePortableTextBlocks(yacht.marinaInformation, locale),
    Promise.all(
      (yacht.faqs ?? []).map(async (faq) => ({
        question: await translateText(faq.question, locale),
        answer: (await translatePortableTextBlocks(faq.answer, locale)) ?? undefined,
      }))
    ),
  ])

  return {
    ...yacht,
    shortDescription: shortDescription || yacht.shortDescription,
    fullDescription: fullDescription ?? yacht.fullDescription,
    amenities,
    included,
    notIncluded,
    routeSuggestions,
    termsAndNotes: termsAndNotes || yacht.termsAndNotes,
    cancellationPaymentPolicies: cancellationPaymentPolicies ?? yacht.cancellationPaymentPolicies,
    cancellationCheckPriceLabel: cancellationCheckPriceLabel || yacht.cancellationCheckPriceLabel,
    sailingLicenceRequired: sailingLicenceRequired || yacht.sailingLicenceRequired,
    petsPolicy: petsPolicy || yacht.petsPolicy,
    paymentMethodsAccepted,
    marinaInformation: marinaInformation ?? yacht.marinaInformation,
    faqs,
  }
}
