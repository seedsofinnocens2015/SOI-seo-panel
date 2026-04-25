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
]);

function toLabel(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function Field({ name, value, onChange }) {
  const commonClasses =
    'mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 shadow-sm outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20';

  if (TEXTAREA_FIELDS.has(name)) {
    return (
      <textarea
        id={name}
        name={name}
        rows={3}
        value={value || ''}
        onChange={onChange}
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
      className={commonClasses}
    />
  );
}

function FieldGrid({ fields, formData, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((field) => (
        <div key={field} className="md:col-span-1">
          <label htmlFor={field} className="text-sm font-semibold text-zinc-700">
            {toLabel(field)}
          </label>
          <Field name={field} value={formData[field]} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}

export default function SeoForm({ formData, onChange }) {
  const sectionClasses = 'rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5';
  const headingClasses = 'mb-4 text-base font-bold text-zinc-900';

  return (
    <div className="space-y-8">
      <section className={sectionClasses}>
        <h3 className={headingClasses}>Basic</h3>
        <FieldGrid fields={FIELD_GROUPS.basic} formData={formData} onChange={onChange} />
      </section>

      <section className={sectionClasses}>
        <h3 className={headingClasses}>Open Graph</h3>
        <FieldGrid fields={FIELD_GROUPS.openGraph} formData={formData} onChange={onChange} />
      </section>

      <section className={sectionClasses}>
        <h3 className={headingClasses}>Twitter</h3>
        <FieldGrid fields={FIELD_GROUPS.twitter} formData={formData} onChange={onChange} />
      </section>

      <section className={sectionClasses}>
        <h3 className={headingClasses}>Item / Schema</h3>
        <FieldGrid fields={FIELD_GROUPS.itemSchema} formData={formData} onChange={onChange} />
      </section>
    </div>
  );
}
