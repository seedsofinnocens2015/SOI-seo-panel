const FIELD_GROUPS = {
  basic: [
    'pageTitle',
    'metaKeyword',
    'metaDescription',
    'newsKeywords',
    'abstract',
    'dcSource',
    'dcTitle',
    'dcKeywords',
    'dcDescription',
    'canonical',
    'alternate',
    'robot',
    'copyright',
    'author',
  ],
  openGraph: [
    'ogLocale',
    'ogType',
    'ogTitle',
    'ogDescription',
    'ogUrl',
    'ogSiteName',
    'ogImage',
    'fbAdmins',
  ],
  twitter: [
    'twitterCard',
    'twitterSite',
    'twitterCreator',
    'twitterTitle',
    'twitterDescription',
    'twitterImageSrc',
    'twitterCanonical',
  ],
  itemSchema: [
    'itemType',
    'itemName',
    'itemDescription',
    'itemUrl',
    'itemImage',
    'itemAuthor',
    'itemOrganization',
  ],
};

const TEXTAREA_FIELDS = new Set([
  'metaDescription',
  'abstract',
  'dcDescription',
  'ogDescription',
  'twitterDescription',
  'itemDescription',
  'rawHeadTags',
]);

function toLabel(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function Field({ name, value, onChange }) {
  const commonClasses =
    'mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20';
  const placeholder = `Enter ${toLabel(name)}`;

  if (TEXTAREA_FIELDS.has(name)) {
    const rows = name === 'rawHeadTags' ? 8 : 3;
    return (
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={commonClasses}
      />
    );
  }

  return (
    <input
      id={name}
      name={name}
      type="text"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className={commonClasses}
    />
  );
}

function FieldGrid({ fields, formData, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {fields.map((field) => {
        const fullWidth = field === 'rawHeadTags';
        return (
          <div
            key={field}
            className={`rounded-xl border border-zinc-100 bg-white/80 p-3 ${fullWidth ? 'lg:col-span-2' : ''}`}
          >
            <label htmlFor={field} className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              {toLabel(field)}
            </label>
            <Field name={field} value={formData[field]} onChange={onChange} />
          </div>
        );
      })}
    </div>
  );
}

export default function SeoForm({ formData, onChange }) {
  const sectionClasses = 'rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm';
  const headingClasses = 'text-base font-bold text-zinc-900';

  const sections = [
    {
      key: 'basic',
      title: 'Basic',
      subtitle: 'Core SEO fields like title, description, canonical and robots.',
      accent: 'from-[#df3655]/15 to-transparent',
      fields: FIELD_GROUPS.basic,
    },
    {
      key: 'openGraph',
      title: 'Open Graph',
      subtitle: 'Social preview tags for Facebook and link-sharing platforms.',
      accent: 'from-[#2EA6F7]/15 to-transparent',
      fields: FIELD_GROUPS.openGraph,
    },
    {
      key: 'twitter',
      title: 'Twitter',
      subtitle: 'Card content and image details for X/Twitter previews.',
      accent: 'from-sky-400/15 to-transparent',
      fields: FIELD_GROUPS.twitter,
    },
    {
      key: 'itemSchema',
      title: 'Item / Schema',
      subtitle: 'Structured data fields used for knowledge and rich snippets.',
      accent: 'from-violet-400/15 to-transparent',
      fields: FIELD_GROUPS.itemSchema,
    },
    {
      key: 'rawHeadTags',
      title: 'Raw Head Tags',
      subtitle: 'Paste raw meta/script tags to inject directly in the page head.',
      accent: 'from-amber-400/15 to-transparent',
      fields: ['rawHeadTags'],
    },
  ];

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.key} className={sectionClasses}>
          <div className={`mb-4 rounded-xl bg-gradient-to-r ${section.accent} px-4 py-3`}>
            <h3 className={headingClasses}>{section.title}</h3>
            <p className="mt-1 text-xs text-zinc-600">{section.subtitle}</p>
          </div>
          <FieldGrid fields={section.fields} formData={formData} onChange={onChange} />
        </section>
      ))}
    </div>
  );
}
