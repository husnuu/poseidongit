import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'siteFooter',
    title: 'Footer Ayarları',
    type: 'document',
    fields: [
        // Brand
        defineField({
            name: 'brandName',
            title: 'Marka Adı',
            type: 'string',
            description: 'Footer\'da gösterilecek marka adı',
            initialValue: '',
            validation: (Rule) => Rule.required().error('Marka adı zorunludur'),
        }),
        defineField({
            name: 'logo',
            title: 'Logo (yedek)',
            type: 'image',
            description:
                'Site Ayarları’nda logo varsa footer’da da o kullanılır (header ile aynı boyut). Burası yalnızca Site Ayarları logosu yoksa gösterilir.',
            options: {
                hotspot: true,
            },
            fields: [
                {
                    name: 'alt',
                    type: 'string',
                    title: 'Alternatif Metin',
                },
            ],
        }),

        // Top Rated Section
        defineField({
            name: 'topRated',
            title: 'Top Rated Bölümü',
            type: 'object',
            description: 'Top Rated badge ve rating bilgileri',
            fields: [
                defineField({
                    name: 'enabled',
                    title: 'Aktif',
                    type: 'boolean',
                    initialValue: true,
                }),
                defineField({
                    name: 'label',
                    title: 'Badge Etiketi',
                    type: 'string',
                    description: 'Örn: "TOP RATED"',
                    initialValue: 'TOP RATED',
                }),
                defineField({
                    name: 'labelEn',
                    title: 'Badge (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'labelDe',
                    title: 'Badge (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'ratingValue',
                    title: 'Rating Değeri',
                    type: 'number',
                    description: 'Örn: 5.0',
                    initialValue: 5.0,
                    validation: (Rule) => Rule.min(0).max(5).error('Rating 0-5 arası olmalıdır'),
                }),
                defineField({
                    name: 'ratingMax',
                    title: 'Maksimum Rating',
                    type: 'number',
                    description: 'Örn: 5.0',
                    initialValue: 5.0,
                }),
                defineField({
                    name: 'reviewCount',
                    title: 'Değerlendirme Sayısı',
                    type: 'number',
                    description: 'Örn: 1322',
                    initialValue: 0,
                }),
            ],
        }),

        // Contact Information
        defineField({
            name: 'contact',
            title: 'İletişim Bilgileri',
            type: 'object',
            fields: [
                defineField({
                    name: 'email',
                    title: 'E-posta',
                    type: 'string',
                    validation: (Rule) => Rule.email().error('Geçerli bir e-posta adresi giriniz'),
                }),
                defineField({
                    name: 'phone',
                    title: 'Telefon',
                    type: 'string',
                }),
                defineField({
                    name: 'addressTitle',
                    title: 'Adres Başlığı',
                    type: 'string',
                    description: 'Örn: "Office Address"',
                    initialValue: 'Office Address',
                }),
                defineField({
                    name: 'addressTitleEn',
                    title: 'Adres başlığı (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'addressTitleDe',
                    title: 'Adres başlığı (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'addressLines',
                    title: 'Adres Satırları',
                    type: 'array',
                    of: [{ type: 'string' }],
                    description: 'Adresin her satırı için ayrı öğe',
                }),
                defineField({
                    name: 'chatTitle',
                    title: 'Chat Başlığı',
                    type: 'string',
                    description: 'Örn: "Chat With Our Team"',
                    initialValue: 'Chat With Our Team',
                }),
                defineField({
                    name: 'chatTitleEn',
                    title: 'Chat başlığı (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'chatTitleDe',
                    title: 'Chat başlığı (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'chatValue',
                    title: 'Chat Değeri',
                    type: 'string',
                    description: 'Örn: "+90 ..."',
                }),
                defineField({
                    name: 'openingTitle',
                    title: 'Çalışma Saatleri Başlığı',
                    type: 'string',
                    description: 'Örn: "Opening Hours"',
                    initialValue: 'Opening Hours',
                }),
                defineField({
                    name: 'openingTitleEn',
                    title: 'Çalışma saatleri başlığı (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'openingTitleDe',
                    title: 'Çalışma saatleri başlığı (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'openingValue',
                    title: 'Çalışma Saatleri',
                    type: 'string',
                    description: 'Örn: "Monday - Friday: 9am to 5pm (GMT)"',
                }),
                defineField({
                    name: 'openingValueEn',
                    title: 'Çalışma saatleri metni (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'openingValueDe',
                    title: 'Çalışma saatleri metni (Deutsch)',
                    type: 'string',
                }),
            ],
        }),

        // Explore Section
        defineField({
            name: 'explore',
            title: 'EXPLORE Bölümü',
            type: 'object',
            fields: [
                defineField({
                    name: 'title',
                    title: 'Başlık',
                    type: 'string',
                    initialValue: 'EXPLORE',
                }),
                defineField({
                    name: 'titleEn',
                    title: 'Başlık (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'titleDe',
                    title: 'Başlık (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'links',
                    title: 'Linkler',
                    type: 'array',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                defineField({
                                    name: 'label',
                                    title: 'Etiket',
                                    type: 'string',
                                    validation: (Rule) => Rule.required().error('Etiket zorunludur'),
                                }),
                                defineField({
                                    name: 'labelEn',
                                    title: 'Etiket (English)',
                                    type: 'string',
                                }),
                                defineField({
                                    name: 'labelDe',
                                    title: 'Etiket (Deutsch)',
                                    type: 'string',
                                }),
                                defineField({
                                    name: 'href',
                                    title: 'Link',
                                    type: 'string',
                                    validation: (Rule) => Rule.required().error('Link zorunludur'),
                                }),
                                defineField({
                                    name: 'openInNewTab',
                                    title: 'Yeni Sekmede Aç',
                                    type: 'boolean',
                                    initialValue: false,
                                }),
                            ],
                            preview: {
                                select: {
                                    label: 'label',
                                    href: 'href',
                                },
                                prepare({ label, href }) {
                                    return {
                                        title: label,
                                        subtitle: href,
                                    }
                                },
                            },
                        },
                    ],
                }),
            ],
        }),

        // Social Media
        defineField({
            name: 'social',
            title: 'Sosyal Medya',
            type: 'object',
            fields: [
                defineField({
                    name: 'title',
                    title: 'Başlık',
                    type: 'string',
                    description: 'Örn: "See What We\'re Up To"',
                    initialValue: 'See What We\'re Up To',
                }),
                defineField({
                    name: 'titleEn',
                    title: 'Başlık (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'titleDe',
                    title: 'Başlık (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'items',
                    title: 'Sosyal Medya Hesapları',
                    type: 'array',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                defineField({
                                    name: 'platform',
                                    title: 'Platform',
                                    type: 'string',
                                    options: {
                                        list: [
                                            { title: 'YouTube', value: 'youtube' },
                                            { title: 'Instagram', value: 'instagram' },
                                            { title: 'Facebook', value: 'facebook' },
                                            { title: 'TikTok', value: 'tiktok' },
                                            { title: 'X (Twitter)', value: 'x' },
                                            { title: 'LinkedIn', value: 'linkedin' },
                                        ],
                                    },
                                    validation: (Rule) => Rule.required().error('Platform seçimi zorunludur'),
                                }),
                                defineField({
                                    name: 'href',
                                    title: 'Link',
                                    type: 'url',
                                    validation: (Rule) => Rule.required().error('Link zorunludur'),
                                }),
                                defineField({
                                    name: 'enabled',
                                    title: 'Aktif',
                                    type: 'boolean',
                                    initialValue: true,
                                }),
                            ],
                            preview: {
                                select: {
                                    platform: 'platform',
                                    href: 'href',
                                },
                                prepare({ platform, href }) {
                                    return {
                                        title: platform,
                                        subtitle: href,
                                    }
                                },
                            },
                        },
                    ],
                }),
            ],
        }),

        // Brag Section (Awards/Badges)
        defineField({
            name: 'brag',
            title: 'Footer — ödül / rozet bölümü',
            description:
                '“Not to brag, but…” alanı: isteğe bağlı kapatılabilir; başlık ve rozetler aşağıdan düzenlenir.',
            type: 'object',
            fields: [
                defineField({
                    name: 'enabled',
                    title: 'Bölümü göster',
                    type: 'boolean',
                    description: 'Kapalıyken footer’da bu sütun ve rozetler görünmez.',
                    initialValue: true,
                }),
                defineField({
                    name: 'title',
                    title: 'Bölüm başlığı',
                    type: 'string',
                    description: 'Örn. “NOT TO BRAG, BUT…” veya “Ödüllerimiz”.',
                    initialValue: 'Not to brag, but…',
                }),
                defineField({
                    name: 'titleEn',
                    title: 'Bölüm başlığı (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'titleDe',
                    title: 'Bölüm başlığı (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'badges',
                    title: 'Rozetler/Sertifikalar',
                    type: 'array',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                defineField({
                                    name: 'type',
                                    title: 'Tip',
                                    type: 'string',
                                    options: {
                                        list: [
                                            { title: 'Görsel', value: 'image' },
                                            { title: 'SVG', value: 'svg' },
                                        ],
                                    },
                                    initialValue: 'image',
                                }),
                                defineField({
                                    name: 'image',
                                    title: 'Görsel',
                                    type: 'image',
                                    description: 'Rozet/sertifika görseli',
                                    options: {
                                        hotspot: true,
                                    },
                                    fields: [
                                        {
                                            name: 'alt',
                                            type: 'string',
                                            title: 'Alternatif Metin',
                                        },
                                    ],
                                }),
                                defineField({
                                    name: 'alt',
                                    title: 'Alternatif Metin',
                                    type: 'string',
                                }),
                                defineField({
                                    name: 'altEn',
                                    title: 'Alternatif metin (English)',
                                    type: 'string',
                                }),
                                defineField({
                                    name: 'altDe',
                                    title: 'Alternatif metin (Deutsch)',
                                    type: 'string',
                                }),
                                defineField({
                                    name: 'href',
                                    title: 'Link (Opsiyonel)',
                                    type: 'string',
                                    description: 'Rozete tıklandığında gidilecek link',
                                }),
                                defineField({
                                    name: 'enabled',
                                    title: 'Aktif',
                                    type: 'boolean',
                                    initialValue: true,
                                }),
                            ],
                            preview: {
                                select: {
                                    media: 'image',
                                    alt: 'alt',
                                },
                                prepare({ media, alt }) {
                                    return {
                                        title: alt || 'Rozet',
                                        media: media,
                                    }
                                },
                            },
                        },
                    ],
                }),
            ],
        }),

        // Legal Links
        defineField({
            name: 'legalLinks',
            title: 'Yasal Linkler',
            type: 'object',
            fields: [
                defineField({
                    name: 'items',
                    title: 'Linkler',
                    type: 'array',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                defineField({
                                    name: 'label',
                                    title: 'Etiket',
                                    type: 'string',
                                    validation: (Rule) => Rule.required().error('Etiket zorunludur'),
                                }),
                                defineField({
                                    name: 'labelEn',
                                    title: 'Etiket (English)',
                                    type: 'string',
                                }),
                                defineField({
                                    name: 'labelDe',
                                    title: 'Etiket (Deutsch)',
                                    type: 'string',
                                }),
                                defineField({
                                    name: 'href',
                                    title: 'Link',
                                    type: 'string',
                                    validation: (Rule) => Rule.required().error('Link zorunludur'),
                                }),
                                defineField({
                                    name: 'enabled',
                                    title: 'Aktif',
                                    type: 'boolean',
                                    initialValue: true,
                                }),
                            ],
                            preview: {
                                select: {
                                    label: 'label',
                                    href: 'href',
                                },
                                prepare({ label, href }) {
                                    return {
                                        title: label,
                                        subtitle: href,
                                    }
                                },
                            },
                        },
                    ],
                }),
            ],
        }),

        // Footer Legal + Secure 3D Payment (en alttaki band)
        defineField({
            name: 'footerLegal',
            title: 'Legal & Secure 3D Payment',
            type: 'object',
            description: 'Footer\'ın en altındaki copyright, şirket açıklaması ve ödeme logoları',
            fields: [
                defineField({
                    name: 'copyrightText',
                    title: 'Copyright Metni',
                    type: 'string',
                    description: 'Örn: "© 2005–2026 boattripturkey.com"',
                }),
                defineField({
                    name: 'copyrightTextEn',
                    title: 'Copyright (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'copyrightTextDe',
                    title: 'Copyright (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'companyLine1',
                    title: 'Şirket Açıklama Satır 1',
                    type: 'string',
                    description: 'Örn: "boattripturkey.com is a trading name of ..."',
                }),
                defineField({
                    name: 'companyLine1En',
                    title: 'Şirket satır 1 (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'companyLine1De',
                    title: 'Şirket satır 1 (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'companyLine2',
                    title: 'Acenta / Lisans Satırı',
                    type: 'string',
                    description: 'Örn: "Registered Travel Agency: ... Licence No: 5985"',
                }),
                defineField({
                    name: 'companyLine2En',
                    title: 'Şirket satır 2 (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'companyLine2De',
                    title: 'Şirket satır 2 (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'secure3dLabel',
                    title: 'Güvenli Ödeme Etiketi',
                    type: 'string',
                    initialValue: 'Secure 3D payment',
                }),
                defineField({
                    name: 'secure3dLabelEn',
                    title: 'Güvenli ödeme etiketi (English)',
                    type: 'string',
                }),
                defineField({
                    name: 'secure3dLabelDe',
                    title: 'Güvenli ödeme etiketi (Deutsch)',
                    type: 'string',
                }),
                defineField({
                    name: 'paymentLogos',
                    title: 'Ödeme Yöntemi Logoları',
                    type: 'array',
                    description: 'Visa, Mastercard, Discover vb. (en fazla 8)',
                    validation: (Rule) => Rule.max(8),
                    of: [
                        {
                            type: 'image',
                            options: { hotspot: true },
                            fields: [
                                {
                                    name: 'alt',
                                    type: 'string',
                                    title: 'Alternatif Metin',
                                    description: 'Örn: "Visa"',
                                },
                            ],
                        },
                    ],
                }),
            ],
        }),

        // Crafted by (footer en altı)
        defineField({
            name: 'craftedBy',
            title: 'Crafted by',
            type: 'object',
            description: 'Footer\'ın en altında "Crafted by [İsim]" satırı; isim LinkedIn\'e linklenir.',
            fields: [
                defineField({
                    name: 'name',
                    title: 'İsim',
                    type: 'string',
                    description: 'Örn: "Ahmet Yılmaz"',
                }),
                defineField({
                    name: 'linkedInUrl',
                    title: 'LinkedIn Profil URL',
                    type: 'url',
                    description: 'İsme tıklandığında açılacak LinkedIn profil linki',
                }),
            ],
        }),

        // Payment Security Section
        defineField({
            name: 'paymentSecurity',
            title: '3D Güvenli Ödeme Bölümü',
            type: 'object',
            fields: [
                defineField({
                    name: 'enabled',
                    title: 'Aktif',
                    type: 'boolean',
                    initialValue: true,
                    description: '3D Güvenli Ödeme bölümünü göster/gizle',
                }),
                defineField({
                    name: 'title',
                    title: 'Başlık',
                    type: 'string',
                    description: 'Örn: "3D Güvenli Ödeme"',
                    initialValue: '3D Güvenli Ödeme',
                }),
                defineField({
                    name: 'paymentLogos',
                    title: 'Ödeme Logoları',
                    type: 'array',
                    description: 'Kredi kartı ve ödeme yöntemi logoları',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                defineField({
                                    name: 'name',
                                    title: 'Ödeme Yöntemi Adı',
                                    type: 'string',
                                    description: 'Örn: "VISA", "Mastercard", "AMEX"',
                                    validation: (Rule) => Rule.required().error('Ad zorunludur'),
                                }),
                                defineField({
                                    name: 'logo',
                                    title: 'Logo',
                                    type: 'image',
                                    description: 'Ödeme yöntemi logosu',
                                    options: {
                                        hotspot: true,
                                    },
                                    fields: [
                                        {
                                            name: 'alt',
                                            type: 'string',
                                            title: 'Alternatif Metin',
                                        },
                                    ],
                                    validation: (Rule) => Rule.required().error('Logo zorunludur'),
                                }),
                                defineField({
                                    name: 'enabled',
                                    title: 'Aktif',
                                    type: 'boolean',
                                    initialValue: true,
                                }),
                            ],
                            preview: {
                                select: {
                                    title: 'name',
                                    media: 'logo',
                                },
                                prepare({ title, media }) {
                                    return {
                                        title: title || 'Ödeme Logosu',
                                        media: media,
                                    }
                                },
                            },
                        },
                    ],
                }),
            ],
        }),
    ],
    preview: {
        select: {
            brandName: 'brandName',
        },
        prepare({ brandName }) {
            return {
                title: brandName || 'Footer Ayarları',
                subtitle: 'Footer yapılandırması',
            }
        },
    },
})

