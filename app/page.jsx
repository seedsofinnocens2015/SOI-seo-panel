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

function parsePreviewToSeoData(previewText, baseData, pageUrl) {
  const nextData = { ...baseData, pageUrl };
  const editableKeys = [
    'pageTitle',
    'metaKeyword',
    'metaDescription',
    'newsKeywords',
    'abstract',
    'robot',
    'author',
    'copyright',
    'ogLocale',
    'ogType',
    'ogTitle',
    'ogDescription',
    'ogUrl',
    'ogSiteName',
    'ogImage',
    'twitterCard',
    'twitterSite',
    'twitterCreator',
    'twitterTitle',
    'twitterDescription',
    'twitterImageSrc',
    'canonical',
    'alternate',
  ];
  editableKeys.forEach((key) => {
    nextData[key] = '';
  });

  const titleMatch = previewText.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) nextData.pageTitle = titleMatch[1].trim();

  const fieldMap = {
    metaKeyword: 'metaKeyword',
    metaDescription: 'metaDescription',
    newsKeywords: 'newsKeywords',
    abstract: 'abstract',
    robot: 'robot',
    author: 'author',
    copyright: 'copyright',
    ogLocale: 'ogLocale',
    ogType: 'ogType',
    ogTitle: 'ogTitle',
    ogDescription: 'ogDescription',
    ogUrl: 'ogUrl',
    ogSiteName: 'ogSiteName',
    ogImage: 'ogImage',
    twitterCard: 'twitterCard',
    twitterSite: 'twitterSite',
    twitterCreator: 'twitterCreator',
    twitterTitle: 'twitterTitle',
    twitterDescription: 'twitterDescription',
    twitterImageSrc: 'twitterImageSrc',
  };

  const metaRegex = /<meta\s+([^>]*?)\/?>/gi;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(previewText)) !== null) {
    const attrs = metaMatch[1];
    const nameMatch = attrs.match(/\bname\s*=\s*"([^"]+)"/i);
    const propertyMatch = attrs.match(/\bproperty\s*=\s*"([^"]+)"/i);
    const contentMatch = attrs.match(/\bcontent\s*=\s*"([^"]*)"/i);
    const tagKey = (nameMatch?.[1] || propertyMatch?.[1] || '').trim();
    if (!tagKey || !fieldMap[tagKey]) continue;
    nextData[fieldMap[tagKey]] = (contentMatch?.[1] || '').trim();
  }

  const canonicalMatch = previewText.match(
    /<link\s+[^>]*rel\s*=\s*"canonical"[^>]*href\s*=\s*"([^"]*)"[^>]*\/?>/i
  );
  if (canonicalMatch) nextData.canonical = canonicalMatch[1].trim();

  const alternateMatch = previewText.match(
    /<link\s+[^>]*rel\s*=\s*"alternate"[^>]*href\s*=\s*"([^"]*)"[^>]*\/?>/i
  );
  if (alternateMatch) nextData.alternate = alternateMatch[1].trim();

  return nextData;
}

function getTopLevelLabel(node, parentTrail) {
  if (!parentTrail.length) return node.label;
  return parentTrail[0];
}

function getSectionAccentClass(topLevelLabel) {
  const accentMap = {
    Home: 'from-emerald-400/20 to-transparent text-emerald-700',
    'Infertility Treatment': 'from-rose-400/20 to-transparent text-rose-700',
    'IVF Centres': 'from-indigo-400/20 to-transparent text-indigo-700',
    'International Patients': 'from-cyan-400/20 to-transparent text-cyan-700',
    Resources: 'from-amber-400/25 to-transparent text-amber-700',
    'About Us': 'from-violet-400/20 to-transparent text-violet-700',
    Doctors: 'from-sky-400/20 to-transparent text-sky-700',
    'Contact Us': 'from-orange-400/20 to-transparent text-orange-700',
  };
  return accentMap[topLevelLabel] || 'from-zinc-300/30 to-transparent text-zinc-700';
}

function SidebarNode({
  node,
  selectedPage,
  expandedNodes,
  onToggle,
  onSelect,
  level = 0,
  parentTrail = [],
}) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const nodeKey = node.value || node.label;
  const isExpanded = expandedNodes[nodeKey];
  const isSelected = node.value && selectedPage === node.value;
  const childCount = hasChildren ? node.children.length : 0;
  const topLevelLabel = getTopLevelLabel(node, parentTrail);
  const accentClass = getSectionAccentClass(topLevelLabel);

  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-xl transition ${
          level === 0 ? 'bg-white/70 px-2 py-1.5 ring-1 ring-zinc-100' : 'px-1 py-0.5'
        }`}
        style={{ marginLeft: `${Math.max(0, level - 1) * 10}px` }}
        onClick={() => {
          if (hasChildren && !node.value) {
            onToggle(nodeKey);
          }
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(nodeKey);
            }}
            className="grid h-5 w-5 place-items-center rounded-md border border-zinc-200 bg-white text-[11px] text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ›
            </span>
          </button>
        ) : (
          <span className="w-4 text-center text-[10px] text-zinc-300">•</span>
        )}

        {node.value ? (
          <button
            type="button"
            onClick={() => onSelect(node.value)}
            className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${
              isSelected
                ? 'bg-gradient-to-r from-[#df3655]/15 to-[#df3655]/5 font-semibold text-[#df3655] ring-1 ring-[#df3655]/20'
                : 'text-zinc-700 transition hover:bg-zinc-100/80'
            }`}
            title={node.value}
          >
            <span className="line-clamp-1">{node.label}</span>
          </button>
        ) : (
          <div
            className={`flex w-full cursor-pointer items-center justify-between rounded-lg bg-gradient-to-r px-2.5 py-1.5 ${accentClass}`}
            title="Click to expand/collapse"
          >
            <span className="text-sm font-semibold">{node.label}</span>
            {childCount > 0 ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500 ring-1 ring-zinc-200">
                {childCount}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {hasChildren && isExpanded ? (
        <ul className="ml-2 mt-1 space-y-1 border-l border-zinc-200/80 pl-2">
          {node.children.map((child) => (
            <SidebarNode
              key={child.value || child.label}
              node={child}
              selectedPage={selectedPage}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              level={level + 1}
              parentTrail={[...parentTrail, node.label]}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function flattenPageTree(nodes, trail = []) {
  return nodes.flatMap((node) => {
    const nextTrail = [...trail, node.label];
    const current = node.value
      ? [
          {
            label: node.label,
            value: node.value,
            pathTrail: nextTrail.join(' > '),
            searchText: `${node.label} ${node.value} ${nextTrail.join(' ')}`.toLowerCase(),
          },
        ]
      : [];
    const children = Array.isArray(node.children) ? flattenPageTree(node.children, nextTrail) : [];
    return [...current, ...children];
  });
}

export default function HomePage() {
  const [selectedPage, setSelectedPage] = useState('/');
  const [formData, setFormData] = useState(makeEmptySeo('/'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDraft, setPreviewDraft] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
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
  const allPageOptions = useMemo(() => flattenPageTree(PAGE_TREE), []);
  const filteredSearchResults = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return [];
    return allPageOptions.filter((item) => item.searchText.includes(query)).slice(0, 8);
  }, [allPageOptions, searchText]);

  function handleToggleNode(nodeKey) {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  }

  function handleSelectFromSearch(item) {
    setSelectedPage(item.value);
    setSearchText(item.value);
    setShowSearchResults(false);
  }

  function startSidebarResize() {
    setIsResizingSidebar(true);
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

  useEffect(() => {
    function handleMouseMove(event) {
      if (!isResizingSidebar) return;
      const minWidth = 260;
      const maxWidth = 520;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, event.clientX));
      setSidebarWidth(nextWidth);
    }

    function handleMouseUp() {
      setIsResizingSidebar(false);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const previewMarkup = useMemo(() => {
    const tags = [];
    const value = (key) => (formData[key] || '').trim();
    const pushMeta = (attr, key) => {
      if (value(key)) tags.push(`<meta ${attr}="${key}" content="${value(key)}" />`);
    };

    if (value('pageTitle')) tags.push(`<title>${value('pageTitle')}</title>`);
    pushMeta('name', 'metaKeyword');
    pushMeta('name', 'metaDescription');
    pushMeta('name', 'newsKeywords');
    pushMeta('name', 'abstract');
    pushMeta('name', 'robot');
    pushMeta('name', 'author');
    pushMeta('name', 'copyright');
    pushMeta('property', 'ogLocale');
    pushMeta('property', 'ogType');
    pushMeta('property', 'ogTitle');
    pushMeta('property', 'ogDescription');
    pushMeta('property', 'ogUrl');
    pushMeta('property', 'ogSiteName');
    pushMeta('property', 'ogImage');
    pushMeta('name', 'twitterCard');
    pushMeta('name', 'twitterSite');
    pushMeta('name', 'twitterCreator');
    pushMeta('name', 'twitterTitle');
    pushMeta('name', 'twitterDescription');
    pushMeta('name', 'twitterImageSrc');

    if (value('canonical')) tags.push(`<link rel="canonical" href="${value('canonical')}" />`);
    if (value('alternate')) tags.push(`<link rel="alternate" href="${value('alternate')}" />`);

    return tags.length
      ? [`<!-- HEAD preview for ${targetPageUrl} -->`, ...tags].join('\n')
      : '<!-- No SEO tags filled yet -->';
  }, [formData, targetPageUrl]);

  function openPreview() {
    setSuccessMessage('');
    setErrorMessage('');
    setPreviewDraft(previewMarkup);
    setIsPreviewOpen(true);
  }

  async function handleSave(payload = formData) {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const savedData = await saveSeo({
        ...payload,
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
        <aside
          className="relative flex h-full shrink-0 flex-col border-r border-zinc-200 bg-gradient-to-b from-white via-white to-zinc-50/70 p-4 shadow-sm backdrop-blur"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="shrink-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <Image
              src="/Header Logo.svg"
              alt="Seeds of Innocence"
              width={220}
              height={68}
              priority
              className="h-auto w-auto max-w-[210px]"
            />
            <p className="mt-2 text-xs text-zinc-500">Select a page path to edit SEO details.</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-[#2EA6F7]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1c7fbe]">
              Total Pages: {allPageOptions.length}
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <ul className="space-y-1.5 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              {PAGE_TREE.map((node) => (
                <SidebarNode
                  key={node.value || node.label}
                  node={node}
                  selectedPage={selectedPage}
                  expandedNodes={expandedNodes}
                  onToggle={handleToggleNode}
                  onSelect={setSelectedPage}
                  parentTrail={[]}
                />
              ))}
            </ul>
          </div>

          <button
            type="button"
            onMouseDown={startSidebarResize}
            className={`absolute right-0 top-0 h-full w-2 translate-x-1/2 cursor-col-resize rounded-full transition ${
              isResizingSidebar ? 'bg-[#2EA6F7]/30' : 'bg-transparent hover:bg-[#2EA6F7]/20'
            }`}
            title="Drag to resize sidebar"
            aria-label="Resize sidebar"
          />
        </aside>

        <div className="h-full flex-1 overflow-y-auto">
          <div className="mx-auto h-full w-full max-w-[1200px] p-6">
            <div className="flex h-full flex-col bg-white p-6">
              <div className="shrink-0 border-b border-zinc-100 pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2EA6F7]">Seeds of Innocence</p>
                    <h1 className="mt-1 text-2xl font-bold text-zinc-900">SEO Admin Panel</h1>
                    <p className="mt-2 text-sm text-zinc-600">
                      Selected path:{' '}
                      <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-900">
                        {targetPageUrl}
                      </span>
                    </p>
                  </div>

                  <div className="relative w-full max-w-xl">
                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) => {
                        setSearchText(event.target.value);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && filteredSearchResults.length > 0) {
                          event.preventDefault();
                          handleSelectFromSearch(filteredSearchResults[0]);
                        }
                      }}
                      placeholder="Search by page name or path (e.g. IVF, /contact/whatsapp)"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
                    />

                    {showSearchResults && searchText.trim() ? (
                      <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                        {filteredSearchResults.length > 0 ? (
                          filteredSearchResults.map((item) => (
                            <button
                              key={`${item.value}-${item.pathTrail}`}
                              type="button"
                              onClick={() => handleSelectFromSearch(item)}
                              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-100"
                            >
                              <p className="text-sm font-medium text-zinc-800">{item.label}</p>
                              <p className="text-xs text-zinc-500">{item.value}</p>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-zinc-500">No page found</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-sm text-zinc-600">Loading SEO data...</p>
                ) : (
                  <form className="space-y-6">
                    <SeoForm
                      formData={formData}
                      onChange={handleFieldChange}
                    />

                    <div className="flex items-center gap-3 pb-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={openPreview}
                        className="rounded-xl bg-[#df3655] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c92c49] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Preview & Save SEO
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
      </div>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">SEO Preview</h3>
                <p className="text-sm text-zinc-600">Path: {targetPageUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto p-5">
              <p className="mb-2 text-xs text-zinc-500">
              You can edit directly within the preview. Upon confirming the save, these edited tags will be saved.
              </p>
              <textarea
                value={previewDraft}
                onChange={(event) => setPreviewDraft(event.target.value)}
                className="min-h-[360px] w-full rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-100 outline-none ring-1 ring-zinc-700 focus:ring-2 focus:ring-[#2EA6F7]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Close Preview
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const parsedData = parsePreviewToSeoData(previewDraft, formData, targetPageUrl);
                  setFormData(parsedData);
                  await handleSave(parsedData);
                  setIsPreviewOpen(false);
                }}
                className="rounded-xl bg-[#df3655] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c92c49] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Confirm Save SEO'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
