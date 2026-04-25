'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import SeoForm from './components/SeoForm';
import { fetchSeo, saveSeo } from '../lib/seoApi';

const PAGE_TREE = [
  { label: 'Home', value: '/' },
  {
    label: 'Infertility Treatment',
    children: [
      {
        label: 'Fertility Treatments',
        children: [
          { label: 'IVF', value: '/fertility-treatments/ivf' },
          { label: 'ICSI', value: '/fertility-treatments/icsi' },
          { label: 'IUI', value: '/fertility-treatments/iui' },
          {
            label: 'Monitoring in an IUI Cycle',
            value: '/fertility-treatments/monitoring-in-an-iui-cycle-steps',
          },
          { label: 'Ovulation Induction', value: '/fertility-treatments/ovulation-induction' },
          { label: 'Follicular Monitoring', value: '/fertility-treatments/follicular-monitoring' },
          { label: 'Blastocyst Transfer', value: '/fertility-treatments/blastocyst-transfer' },
          { label: 'Secondary Infertility', value: '/fertility-treatments/secondary-infertility' },
        ],
      },
      {
        label: 'IVF Procedures & Preservation',
        children: [
          { label: 'Egg Freezing', value: '/ivf-procedures-preservation/egg-freezing' },
          { label: 'Embryo Freezing', value: '/ivf-procedures-preservation/embryo-freezing' },
          { label: 'Cryopreservation', value: '/ivf-procedures-preservation/cryopreservation' },
          { label: 'PRP & Ovarian Rejuvenation', value: '/ivf-procedures-preservation/prp' },
          { label: 'Surrogacy', value: '/ivf-procedures-preservation/surrogacy' },
          { label: 'Donor Program', value: '/ivf-procedures-preservation/donor-program' },
        ],
      },
      {
        label: 'Male Infertility Treatments',
        children: [
          {
            label: 'Male Infertility',
            value: '/male-infertility-treatments/male-infertility-treatment-in-india',
          },
          { label: 'TESA / PESA', value: '/male-infertility-treatments/tesa-pesa' },
          { label: 'MicroTESE', value: '/male-infertility-treatments/microtese' },
          { label: 'Semen Analysis', value: '/male-infertility-treatments/semen-analysis' },
          { label: 'Semen Analysis at Home', value: '/male-infertility-treatments/semen-analysis-at-home' },
          { label: 'Varicocele', value: '/male-infertility-treatments/varicocele' },
          { label: 'Vasectomy Reversal', value: '/male-infertility-treatments/vasectomy-reversal' },
        ],
      },
      {
        label: 'Male Fertility Conditions',
        children: [
          { label: 'Azoospermia', value: '/male-fertility-conditions/azoospermia' },
          {
            label: 'Non-Obstructive Azoospermia',
            value: '/male-fertility-conditions/non-obstructive-azoospermia',
          },
          {
            label: 'Obstructive Azoospermia',
            value: '/male-fertility-conditions/obstructive-azoospermia',
          },
          { label: 'Oligospermia', value: '/male-fertility-conditions/oligospermia' },
          {
            label: 'Blocked Seminiferous Tubules',
            value: '/male-fertility-conditions/blocked-seminiferous-tubules',
          },
          {
            label: 'Endocrinological Disorder in Men',
            value: '/male-fertility-conditions/endocrinological-disorder-in-men',
          },
          {
            label: 'Retrograde Ejaculation',
            value: '/male-fertility-conditions/retrograde-ejaculation',
          },
        ],
      },
      {
        label: 'Genetic Testing & Screening',
        children: [
          { label: 'Genetic Testing', value: '/genetic-testing-screening/genetic-testing' },
          { label: 'Genetic Factors', value: '/genetic-testing-screening/genetic-factors' },
          { label: 'PGT-A', value: '/genetic-testing-screening/pgt-a' },
          { label: 'PGT-M', value: '/genetic-testing-screening/pgt-m' },
          { label: 'PGT-SR', value: '/genetic-testing-screening/pgt-sr' },
          {
            label: 'Difference between PGT A & PGT-M',
            value: '/genetic-testing-screening/difference-between-pgt-a-and-pgt-m',
          },
          { label: 'Amniocentesis', value: '/genetic-testing-screening/amniocentesis' },
          {
            label: 'Chorionic Villus Sampling (CVS)',
            value: '/genetic-testing-screening/chorionic-villus-sampling-cvs',
          },
          {
            label: 'Couple Carrier Screening',
            value: '/genetic-testing-screening/couple-carrier-screening',
          },
          { label: 'Karyotyping', value: '/genetic-testing-screening/karyotyping' },
          { label: 'Microarray', value: '/genetic-testing-screening/microarray' },
          { label: 'HLA Matching', value: '/genetic-testing-screening/hla-matching' },
        ],
      },
      {
        label: 'Maternal–Fetal Medicine (MFM)',
        children: [
          { label: 'High-Risk Pregnancy', value: '/maternal-fetal-medicine/high-risk-pregnancy' },
          { label: 'Fetal Reduction', value: '/maternal-fetal-medicine/fetal-reduction' },
          {
            label: 'MFM Scans & Diagnostics',
            value: '/maternal-fetal-medicine/maternal-and-fetal-medicine',
          },
        ],
      },
      {
        label: 'Surgeries',
        children: [
          { label: 'Hysteroscopy', value: '/surgeries/hysteroscopy' },
          { label: 'Laparoscopy', value: '/surgeries/laparoscopy' },
          { label: 'Open Surgery', value: '/surgeries/open-surgery' },
        ],
      },
      {
        label: 'Reproductive Health Conditions',
        children: [
          {
            label: 'Blocked Fallopian Tubes',
            value: '/reproductive-health-conditions/blocked-fallopian-tubes',
          },
          {
            label: 'PCOS (Polycystic Ovarian Syndrome)',
            value: '/reproductive-health-conditions/pcos-polycystic-ovarian-syndrome',
          },
          {
            label: 'Irregular Menstrual Cycle',
            value: '/reproductive-health-conditions/irregular-menstrual-cycle',
          },
          {
            label: 'Diabetes, Thyroid and Obesity',
            value: '/reproductive-health-conditions/diabetes-thyroid-and-obesity',
          },
          { label: 'Endometrial and Ovarian', value: '/reproductive-health-conditions/endometrial-and-ovarian' },
          { label: 'Endometriosis', value: '/reproductive-health-conditions/endometriosis' },
          {
            label: 'Fibroids, Polyps and Adenomyosis',
            value: '/reproductive-health-conditions/fibroids-polyps-and-adenomyosis',
          },
          { label: 'Tuberculosis', value: '/reproductive-health-conditions/tuberculosis' },
          {
            label: 'Recurrent Miscarriages',
            value: '/reproductive-health-conditions/recurrent-miscarriages',
          },
          {
            label: 'Why Delayed Periods But Not Pregnant',
            value: '/reproductive-health-conditions/reasons-for-delayed-periods-but-not-pregnant',
          },
          {
            label: 'What is Ovarian Hyperstimulation',
            value: '/reproductive-health-conditions/what-is-ovarian-hyperstimulation',
          },
        ],
      },
      {
        label: 'Fertility Wellness',
        children: [
          {
            label: 'Boost Fertility With Colours Of Food',
            value: '/fertility-wellness/how-to-boost-up-fertility-with-the-colours-of-food',
          },
          {
            label: 'Yoga and Fertility',
            value: '/fertility-wellness/yoga-and-fertility-heres-how-yoga-can-support-fertility',
          },
        ],
      },
    ],
  },
  {
    label: 'IVF Centres',
    children: [
      {
        label: 'India',
        children: [
      {
        label: 'Delhi',
        children: [
          { label: 'Delhi Overview', value: '/best-ivf-centre-in-delhi' },
          { label: 'Malviya Nagar, New Delhi', value: '/delhi/best-ivf-centre-in-malviyanagar/' },
          { label: 'Pitampura, New Delhi', value: '/delhi/best-ivf-centre-in-pitampura/' },
          { label: 'Janakpuri, New Delhi', value: '/delhi/best-ivf-centre-in-janakpuri/' },
        ],
      },
      {
        label: 'Uttar Pradesh',
        children: [
          { label: 'Uttar Pradesh Overview', value: '/best-ivf-centre-in-uttar-pradesh' },
          { label: 'Ghaziabad', value: '/uttar-pradesh/best-ivf-centre-in-ghaziabad/' },
          { label: 'Lucknow', value: '/uttar-pradesh/best-ivf-centre-in-lucknow/' },
          { label: 'Agra', value: '/uttar-pradesh/best-ivf-centre-in-agra/' },
          { label: 'Gorakhpur', value: '/uttar-pradesh/best-ivf-centre-in-gorakhpur/' },
          { label: 'Kanpur', value: '/uttar-pradesh/best-ivf-centre-in-kanpur/' },
          { label: 'Meerut', value: '/uttar-pradesh/best-ivf-centre-in-meerut/' },
        ],
      },
      {
        label: 'Bihar',
        children: [
          { label: 'Bihar Overview', value: '/best-ivf-centre-in-bihar' },
          { label: 'Patna', value: '/bihar/best-ivf-centre-in-patna/' },
          { label: 'Muzaffarpur', value: '/bihar/best-ivf-centre-in-muzaffarpur/' },
        ],
      },
      {
        label: 'Haryana',
        children: [
          { label: 'Haryana Overview', value: '/best-ivf-centre-in-haryana' },
          { label: 'Faridabad', value: '/haryana/best-ivf-centre-in-faridabad/' },
          { label: 'Gurugram', value: '/haryana/best-ivf-centre-in-gurugram/' },
        ],
      },
      {
        label: 'Jharkhand',
        children: [
          { label: 'Jharkhand Overview', value: '/best-ivf-centre-in-jharkhand' },
          { label: 'Ranchi', value: '/jharkhand/best-ivf-centre-in-ranchi/' },
        ],
      },
      {
        label: 'Uttarakhand',
        children: [
          { label: 'Uttarakhand Overview', value: '/best-ivf-centre-in-uttarakhand' },
          { label: 'Haldwani', value: '/uttarakhand/best-ivf-centre-in-haldwani/' },
        ],
      },
      {
        label: 'Assam',
        children: [
          { label: 'Assam Overview', value: '/best-ivf-centre-in-assam' },
          { label: 'Guwahati', value: '/assam/best-ivf-centre-in-guwahati/' },
        ],
      },
      {
        label: 'Kerala',
        children: [
          { label: 'Kerala Overview', value: '/best-ivf-centre-in-kerala' },
          { label: 'Kasaragod', value: '/kerala/best-ivf-centre-in-kasaragod/' },
          { label: 'Kochi', value: '/kerala/best-ivf-centre-in-kochi/' },
        ],
      },
      {
        label: 'Jammu & Kashmir',
        children: [
          { label: 'J&K Overview', value: '/best-ivf-centre-in-jammu-kashmir' },
          { label: 'Srinagar', value: '/jammu-kashmir/best-ivf-centre-in-srinagar/' },
        ],
      },
      {
        label: 'West Bengal',
        children: [
          { label: 'West Bengal Overview', value: '/best-ivf-centre-in-west-bengal' },
          { label: 'Kolkata', value: '/west-bengal/best-ivf-centre-in-kolkata/' },
        ],
      },
      {
        label: 'International',
        children: [
          { label: 'International Overview', value: '/ivf-centres/international' },
          { label: 'Mabela, Muscat, Oman', value: '/best-ivf-centre-in-mabela-muscat' },
        ],
      },
        ],
      },
    ],
  },
  {
    label: 'International Patients',
    children: [
      { label: 'Patient Concierge', value: '/international-patients/patient-concierge' },
      { label: 'Travel Support', value: '/international-patients/travel-support' },
      { label: 'International Pricing', value: '/international-patients/international-pricing' },
      { label: 'Contact Team', value: '/international-patients/contact-team' },
    ],
  },
  {
    label: 'Resources',
    children: [
      { label: 'Resources Overview', value: '/resources' },
      { label: 'IVF Process / Patient Journey', value: '/resources/ivf-process-patient-journey' },
      { label: 'FAQs', value: '/resources/faqs' },
      { label: 'Patient Testimonial Videos', value: '/resources/patient-testimonial-videos' },
      { label: 'Fertility Calculator', value: '/resources/fertility-calculator' },
    ],
  },
  {
    label: 'About Us',
    children: [
      { label: 'About us Overview', value: '/about' },
      { label: 'Our Story', value: '/about/our-story' },
      { label: 'Dr. Gauri Agrawal – Founder', value: '/ivf-doctor/dr-gauri-agarwal-ivf-specialist/' },
      { label: 'Leadership Team', value: '/about/leadership-team' },
      { label: 'Vision, Mission & Values', value: '/about/vision-mission-values' },
      { label: 'Success Rates', value: '/about/success-rates' },
      { label: 'Embryology Lab & Technology', value: '/about/embryology-lab-technology' },
      { label: 'Media & Press', value: '/about/media-press' },
      { label: 'Awards & Accreditations', value: '/about/awards-accreditations' },
    ],
  },
  {
    label: 'Doctors',
    children: [
      { label: 'All IVF Specialists', value: '/ivf-doctor' },
      { label: 'Maternal–Fetal Medicine Specialists', value: '/ivf-doctor/maternal-fetal-medicine' },
      { label: 'Surgeon Panel', value: '/ivf-doctor/surgeon-panel' },
    ],
  },
  {
    label: 'Contact Us',
    children: [
      { label: 'Contact Overview', value: '/contact' },
      { label: 'Book Appointment', value: '/contact/book-appointment' },
      { label: 'Online Payment', value: '/contact/online-payment' },
      { label: 'WhatsApp', value: '/contact/whatsapp' },
      { label: 'Call Back Form', value: '/contact/call-back-form' },
      { label: 'Centre Locator', value: '/contact/centre-locator' },
      { label: 'Careers', value: '/contact/careers' },
      { label: 'Feedback', value: '/contact/feedback' },
      { label: 'Common SEO (Fallback)', value: 'common' },
    ],
  },
];

const SEO_FIELDS = [
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
  'ogLocale',
  'ogType',
  'ogTitle',
  'ogDescription',
  'ogUrl',
  'ogSiteName',
  'ogImage',
  'fbAdmins',
  'twitterCard',
  'twitterSite',
  'twitterCreator',
  'twitterTitle',
  'twitterDescription',
  'twitterImageSrc',
  'twitterCanonical',
  'itemType',
  'itemName',
  'itemDescription',
  'itemUrl',
  'itemImage',
  'itemAuthor',
  'itemOrganization',
];

function makeEmptySeo(pageUrl) {
  const state = { pageUrl };
  SEO_FIELDS.forEach((field) => {
    state[field] = '';
  });
  return state;
}

function SidebarNode({ node, selectedPage, expandedNodes, onToggle, onSelect, level = 0 }) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const nodeKey = node.value || node.label;
  const isExpanded = expandedNodes[nodeKey];
  const isSelected = node.value && selectedPage === node.value;

  return (
    <li>
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(nodeKey)}
            className="rounded-md px-1.5 py-0.5 text-xs text-zinc-600 transition hover:bg-zinc-100"
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {node.value ? (
          <button
            type="button"
            onClick={() => onSelect(node.value)}
            className={`w-full rounded px-2 py-1 text-left text-sm ${
              isSelected
                ? 'bg-[#df3655]/10 font-semibold text-[#df3655]'
                : 'text-zinc-700 transition hover:bg-zinc-100'
            }`}
          >
            {node.label}
          </button>
        ) : (
          <span className="px-2 py-1 text-sm font-semibold text-zinc-800">{node.label}</span>
        )}
      </div>

      {hasChildren && isExpanded ? (
        <ul className="ml-3 mt-1 space-y-1 border-l border-zinc-200 pl-2">
          {node.children.map((child) => (
            <SidebarNode
              key={child.value || child.label}
              node={child}
              selectedPage={selectedPage}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function HomePage() {
  const [selectedPage, setSelectedPage] = useState('/');
  const [formData, setFormData] = useState(makeEmptySeo('/'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({
    'Infertility Treatment': true,
    'IVF Centres': true,
    India: true,
    'International Patients': true,
    Resources: true,
    'About Us': true,
    Doctors: true,
    'Contact Us': true,
    Delhi: true,
    'Uttar Pradesh': true,
  });

  const targetPageUrl = useMemo(() => selectedPage, [selectedPage]);

  function handleToggleNode(nodeKey) {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadSeo() {
      setLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      try {
        const seoData = await fetchSeo(targetPageUrl);
        if (isCancelled) return;
        setFormData({
          ...makeEmptySeo(targetPageUrl),
          ...seoData,
          pageUrl: targetPageUrl,
        });
      } catch (error) {
        if (isCancelled) return;
        setFormData(makeEmptySeo(targetPageUrl));
        setErrorMessage(error.message || 'Unable to fetch SEO data');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadSeo();
    return () => {
      isCancelled = true;
    };
  }, [targetPageUrl]);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const savedData = await saveSeo({
        ...formData,
        pageUrl: targetPageUrl,
      });
      setFormData({
        ...makeEmptySeo(targetPageUrl),
        ...savedData,
        pageUrl: targetPageUrl,
      });
      setSuccessMessage('SEO saved successfully.');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save SEO data');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-br from-[#f8fbff] via-white to-[#fff7f9]">
      <div className="flex h-full w-full">
        <aside className="h-full w-[320px] shrink-0 overflow-y-auto border-r border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="border-b border-zinc-200 pb-3">
            <Image
              src="/Header Logo.svg"
              alt="Seeds of Innocence"
              width={220}
              height={68}
              priority
              className="h-auto w-auto max-w-[210px]"
            />
            <p className="mt-2 text-xs text-zinc-500">Select a page path to edit SEO details.</p>
          </div>

          <ul className="mt-4 space-y-1">
            {PAGE_TREE.map((node) => (
              <SidebarNode
                key={node.value || node.label}
                node={node}
                selectedPage={selectedPage}
                expandedNodes={expandedNodes}
                onToggle={handleToggleNode}
                onSelect={setSelectedPage}
              />
            ))}
          </ul>
        </aside>

        <div className="h-full flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] p-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="border-b border-zinc-100 pb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2EA6F7]">Seeds of Innocence</p>
                <h1 className="mt-1 text-2xl font-bold text-zinc-900">SEO Admin Panel</h1>
                <p className="mt-2 text-sm text-zinc-600">
                  Selected path:{' '}
                  <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-900">{targetPageUrl}</span>
                </p>
              </div>

              {loading ? (
                <p className="mt-6 text-sm text-zinc-600">Loading SEO data...</p>
              ) : (
                <form onSubmit={handleSave} className="mt-6 space-y-6">
                  <SeoForm
                    formData={formData}
                    onChange={handleFieldChange}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-[#df3655] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c92c49] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save SEO'}
                    </button>
                  </div>
                </form>
              )}

              {successMessage ? <p className="mt-4 text-sm text-green-700">{successMessage}</p> : null}
              {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
